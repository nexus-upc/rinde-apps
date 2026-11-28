package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import kotlinx.coroutines.CancellationException

data class DriverAccountProfile(
    val fullName: String,
    val companyName: String,
    val role: String,
    val email: String,
    val licenseNumber: String = "",
    val licenseCategory: String = "",
    val licenseExpirationDate: String = "",
    val fleetNotice: String = "",
)

class ProfileRepository(
    private val remoteFactory: (SessionData) -> RindeRemoteClient,
) {
    suspend fun loadProfile(session: SessionData): DriverAccountProfile {
        val remote = remoteFactory(session)
        val user = remote.currentUser()

        var licenseNumber = ""
        var licenseCategory = ""
        var licenseExpirationDate = ""
        var fleetNotice = ""

        try {
            val driver = remote.currentDriver()
            licenseNumber = driver.licenseNumber
            licenseCategory = driver.licenseCategory
            licenseExpirationDate = driver.licenseExpirationDate
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (ex: ApiException) {
            if (ex.status == 401) throw ex
            if (ex.status != 404) {
                fleetNotice = "No pudimos consultar tu licencia en este momento."
            }
        } catch (_: Exception) {
            fleetNotice = "No pudimos consultar tu licencia en este momento."
        }

        return DriverAccountProfile(
            fullName = user.fullName.ifBlank { session.email },
            companyName = user.tenant?.tradeName.orEmpty(),
            role = user.role.ifBlank { session.role },
            email = user.email.ifBlank { session.email },
            licenseNumber = licenseNumber,
            licenseCategory = licenseCategory,
            licenseExpirationDate = licenseExpirationDate,
            fleetNotice = fleetNotice,
        )
    }
}
