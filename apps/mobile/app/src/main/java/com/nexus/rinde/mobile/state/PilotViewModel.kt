package com.nexus.rinde.mobile.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexus.rinde.mobile.BuildConfig
import com.nexus.rinde.mobile.data.ApiException
import com.nexus.rinde.mobile.data.Expense
import com.nexus.rinde.mobile.data.InputRules
import com.nexus.rinde.mobile.data.RindeApi
import com.nexus.rinde.mobile.data.Trip
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.time.LocalDate
import java.util.Base64

data class PilotState(
    val signedIn: Boolean = false,
    val email: String = "",
    val trips: List<Trip> = emptyList(),
    val trip: Trip? = null,
    val expenses: List<Expense> = emptyList(),
    val busy: Boolean = false,
    val error: String = "",
    val expenseError: String = "",
    val message: String = "",
    val expenseSaved: Int = 0,
)

class PilotViewModel : ViewModel() {
    private val mutable = MutableStateFlow(PilotState())
    val state = mutable.asStateFlow()
    private var api: RindeApi? = null
    private var job: Job? = null

    private fun operation(block: suspend () -> Unit) {
        if (mutable.value.busy) return
        mutable.update { it.copy(busy = true, error = "", message = "") }
        job = viewModelScope.launch {
            try { block() }
            catch (e: CancellationException) { throw e }
            catch (e: ApiException) {
                if (e.status == 401 && mutable.value.signedIn) {
                    api = null
                    mutable.value = PilotState(error = "Tu sesión venció. Vuelve a ingresar.")
                } else mutable.update { it.copy(error = e.message.orEmpty()) }
            }
            catch (e: IllegalArgumentException) {
                mutable.update { it.copy(error = e.message.orEmpty()) }
            }
            catch (_: Exception) {
                mutable.update { it.copy(error = "No recibimos confirmación del servidor. Comprueba la conexión y actualiza antes de repetir la operación.") }
            }
            finally { mutable.update { it.copy(busy = false) } }
        }
    }

    fun signIn(server: String, email: String, password: String) = operation {
        val base = InputRules.serverUrl(server, BuildConfig.DEBUG)
        require(email.isNotBlank() && password.isNotBlank()) { "Completa tu correo y contraseña." }
        val result = JSONObject(RindeApi(base).request("POST", "/api/v1/auth/sign-in",
            JSONObject().put("email", email.trim()).put("password", password)))
        val token = result.getString("accessToken")
        val claims = JSONObject(String(Base64.getUrlDecoder().decode(token.split('.')[1]), Charsets.UTF_8))
        require(claims.optString("role") == "DRIVER") { "Ingresa con una cuenta de conductor. La administración está en la web." }
        val authenticated = RindeApi(base, token)
        val trips = authenticated.trips()
        api = authenticated
        mutable.value = PilotState(signedIn = true, email = email.trim(), trips = trips)
    }

    fun refresh() = operation {
        val current = api ?: return@operation
        val id = mutable.value.trip?.id
        val trips = current.trips()
        mutable.update { it.copy(trips = trips) }
        if (id != null) loadDetail(current, id)
    }

    fun open(id: String) = operation {
        val current = api ?: return@operation
        mutable.update { it.copy(trip = null, expenses = emptyList(), expenseError = "") }
        loadDetail(current, id)
    }

    private suspend fun loadDetail(current: RindeApi, id: String) {
        val trip = current.trip(id)
        mutable.update { it.copy(trip = trip, expenseError = "") }
        try {
            val expenses = current.expenses(id)
            mutable.update { it.copy(expenses = expenses) }
        } catch (e: CancellationException) { throw e }
        catch (e: ApiException) {
            if (e.status == 401) throw e
            mutable.update { it.copy(expenses = emptyList(), expenseError = e.message.orEmpty()) }
        } catch (_: Exception) {
            mutable.update { it.copy(expenses = emptyList(), expenseError = "No pudimos consultar los gastos. Actualiza para reintentar.") }
        }
    }

    fun changeStatus(action: String) = operation {
        val current = api ?: return@operation
        val trip = mutable.value.trip ?: return@operation
        require((action == "start" && trip.status == "ASSIGNED") ||
            (action == "finish" && trip.status == "IN_ROUTE")) { "Actualiza el viaje para consultar su estado." }
        val updated = Trip.from(JSONObject(current.request("POST", "/api/v1/trips/${trip.id}/$action", JSONObject())))
        mutable.update { it.copy(trip = updated, message = if (action == "start") "Viaje iniciado." else "Viaje finalizado.") }
        mutable.update { it.copy(trips = it.trips.map { old -> if (old.id == updated.id) updated else old }) }
    }

    fun registerExpense(category: String, amount: String, key: String) = operation {
        val current = api ?: return@operation
        val trip = mutable.value.trip ?: return@operation
        require(trip.status == "IN_ROUTE") { "Solo puedes registrar gastos durante un viaje en ruta." }
        val body = JSONObject().put("category", category).put("amount", InputRules.amount(amount))
            .put("currency", "PEN").put("expenseDate", LocalDate.now().toString()).put("idempotencyKey", key)
        try {
            current.request("POST", "/api/v1/trips/${trip.id}/expenses", body)
        } catch (e: CancellationException) { throw e }
        catch (e: Exception) {
            if (e is ApiException && e.status == 401) throw e
            val found = try { current.expenses(trip.id).any { it.key == key } }
                catch (cancelled: CancellationException) { throw cancelled }
                catch (_: Exception) { false }
            if (!found) throw e
        }
        mutable.update { it.copy(expenseSaved = it.expenseSaved + 1,
            message = "Gasto registrado, pendiente de adjuntar comprobante.") }
        loadDetail(current, trip.id)
    }

    fun back() { if (!mutable.value.busy) mutable.update { it.copy(trip = null, error = "", message = "") } }
    fun signOut() {
        job?.cancel()
        api = null
        mutable.value = PilotState()
    }
}
