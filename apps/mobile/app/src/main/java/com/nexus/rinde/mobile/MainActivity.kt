package com.nexus.rinde.mobile

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.push.TripNotificationHelper
import com.nexus.rinde.mobile.ui.auth.AuthViewModel
import com.nexus.rinde.mobile.ui.auth.SignInScreen
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.expense.ExpenseFormScreen
import com.nexus.rinde.mobile.ui.expense.ExpenseFormViewModel
import com.nexus.rinde.mobile.ui.incident.IncidentFormScreen
import com.nexus.rinde.mobile.ui.incident.IncidentFormViewModel
import com.nexus.rinde.mobile.ui.profile.ProfileQueueSummary
import com.nexus.rinde.mobile.ui.profile.ProfileScreen
import com.nexus.rinde.mobile.ui.profile.ProfileViewModel
import com.nexus.rinde.mobile.ui.queue.QueueScreen
import com.nexus.rinde.mobile.ui.queue.QueueViewModel
import com.nexus.rinde.mobile.ui.theme.RindeTheme
import com.nexus.rinde.mobile.ui.trips.TripDetailScreen
import com.nexus.rinde.mobile.ui.trips.TripsListScreen
import com.nexus.rinde.mobile.ui.trips.TripsViewModel
import kotlinx.coroutines.launch
import java.io.File

private enum class MobileTab {
    TRIPS,
    EXPENSE,
    INCIDENT,
    QUEUE,
    PROFILE,
}

private sealed interface PhotoCaptureTarget {
    data object ExpenseForm : PhotoCaptureTarget
    data object IncidentForm : PhotoCaptureTarget
    data class ExistingExpense(val remoteId: String) : PhotoCaptureTarget
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            RindeTheme {
                RindeAppRoot()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RindeAppRoot() {
    val context = LocalContext.current
    val container = (context.applicationContext as RindeApplication).container

    val authModel: AuthViewModel = viewModel(
        factory = AuthViewModel.Factory(container.sessionRepository),
    )
    val tripsModel: TripsViewModel = viewModel(
        factory = TripsViewModel.Factory(
            tripRepository = container.tripRepository,
            expenseRepository = container.expenseRepository,
            syncEngine = container.syncEngine,
            onSessionExpired = authModel::onSessionExpired,
        ),
    )
    val formModel: ExpenseFormViewModel = viewModel(
        factory = ExpenseFormViewModel.Factory(
            expenseRepository = container.expenseRepository,
            photoStore = container.photoStore,
        ),
    )
    val incidentFormModel: IncidentFormViewModel = viewModel(
        factory = IncidentFormViewModel.Factory(
            incidentRepository = container.incidentRepository,
            photoStore = container.photoStore,
        ),
    )
    val queueModel: QueueViewModel = viewModel(
        factory = QueueViewModel.Factory(
            expenseRepository = container.expenseRepository,
            syncEngine = container.syncEngine,
            onSessionExpired = authModel::onSessionExpired,
            onSyncedCompleted = tripsModel::refreshOpenTripExpenses,
        ),
    )
    val profileModel: ProfileViewModel = viewModel(
        factory = ProfileViewModel.Factory(
            profileRepository = container.profileRepository,
            onSessionExpired = authModel::onSessionExpired,
        ),
    )

    val authState by authModel.state.collectAsStateWithLifecycle()
    val tripsState by tripsModel.state.collectAsStateWithLifecycle()
    val formState by formModel.state.collectAsStateWithLifecycle()
    val incidentFormState by incidentFormModel.state.collectAsStateWithLifecycle()
    val queueState by queueModel.state.collectAsStateWithLifecycle()
    val profileState by profileModel.state.collectAsStateWithLifecycle()
    val isOnline by container.networkMonitor.isOnline.collectAsStateWithLifecycle()

    val scope = rememberCoroutineScope()
    var activeTab by rememberSaveable { mutableStateOf(MobileTab.TRIPS) }
    var confirmAction by remember { mutableStateOf("") }
    var confirmSignOutPending by remember { mutableIntStateOf(-1) }
    var attachTargetExpenseId by remember { mutableStateOf<String?>(null) }
    var pendingCameraUri by remember { mutableStateOf<android.net.Uri?>(null) }
    var pendingCameraCacheFile by remember { mutableStateOf<File?>(null) }
    var pendingPhotoTarget by remember { mutableStateOf<PhotoCaptureTarget?>(null) }
    var requestedNotificationPermissionForUser by rememberSaveable { mutableStateOf<String?>(null) }
    val scroll = rememberScrollState()

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { _ ->
        // El permiso es opcional y no bloquea la operación sin conexión
    }

    val handlePickedImage: (android.net.Uri, String?, File?, PhotoCaptureTarget?) -> Unit =
        { uri, suggestedName, cacheFile, target ->
            when (target) {
                is PhotoCaptureTarget.IncidentForm -> {
                    incidentFormModel.attachPhotoFromUri(uri, suggestedName, cacheFile)
                }
                is PhotoCaptureTarget.ExistingExpense -> {
                    scope.launch {
                        try {
                            val photo = container.photoStore.compressFromUri(uri, suggestedName)
                            tripsModel.attachPhotoToExistingExpense(target.remoteId, photo)
                        } catch (_: Exception) {
                            tripsModel.notifyMessage("No pudimos procesar la foto seleccionada.")
                        } finally {
                            container.photoStore.deleteCacheFile(cacheFile)
                        }
                    }
                }
                PhotoCaptureTarget.ExpenseForm, null -> {
                    formModel.attachPhotoFromUri(uri, suggestedName, cacheFile)
                }
            }
        }

    val takePictureLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture(),
    ) { captured ->
        val uri = pendingCameraUri
        val cacheFile = pendingCameraCacheFile
        val target = pendingPhotoTarget
        pendingCameraUri = null
        pendingCameraCacheFile = null
        pendingPhotoTarget = null
        if (captured && uri != null) {
            val defaultName = if (target is PhotoCaptureTarget.IncidentForm) {
                "foto-incidencia.jpg"
            } else {
                "foto-comprobante.jpg"
            }
            handlePickedImage(uri, defaultName, cacheFile, target)
        } else {
            container.photoStore.deleteCacheFile(cacheFile)
        }
    }

    val pickGalleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        val target = pendingPhotoTarget
        pendingPhotoTarget = null
        if (uri != null) {
            handlePickedImage(uri, null, null, target)
        }
    }

    fun launchCamera(target: PhotoCaptureTarget) {
        val (file, uri) = container.photoStore.createCameraCaptureTarget()
        pendingCameraCacheFile = file
        pendingCameraUri = uri
        pendingPhotoTarget = target
        takePictureLauncher.launch(uri)
    }

    fun launchGallery(target: PhotoCaptureTarget) {
        pendingPhotoTarget = target
        pickGalleryLauncher.launch(
            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
        )
    }

    LaunchedEffect(authState.session) {
        val session = authState.session
        tripsModel.bindSession(session)
        queueModel.bindSession(session)
        profileModel.bindSession(session)
        if (session != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS,
                ) != PackageManager.PERMISSION_GRANTED &&
                requestedNotificationPermissionForUser != session.userId
            ) {
                requestedNotificationPermissionForUser = session.userId
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
            if (isOnline) {
                queueModel.triggerSync(manual = false)
            } else {
                container.pushDeviceRepository.ensurePendingScheduled(session)
            }
        } else {
            activeTab = MobileTab.TRIPS
        }
    }

    LaunchedEffect(isOnline, authState.session) {
        if (isOnline && authState.session != null) {
            queueModel.triggerSync(manual = false)
            tripsModel.loadTrips()
            if (profileState.profile == null && !profileState.loading) {
                profileModel.loadProfile()
            }
        }
    }

    LaunchedEffect(
        authState.error,
        tripsState.error,
        formState.error,
        incidentFormState.error,
        queueState.error,
        profileState.error,
    ) {
        if (authState.error.isNotBlank() ||
            tripsState.error.isNotBlank() ||
            formState.error.isNotBlank() ||
            incidentFormState.error.isNotBlank() ||
            queueState.error.isNotBlank() ||
            profileState.error.isNotBlank()
        ) {
            scroll.animateScrollTo(0)
        }
    }

    val canNavigateBack = authState.signedIn && !tripsState.busy && (
        activeTab != MobileTab.TRIPS || tripsState.selectedTrip != null
        )

    BackHandler(enabled = canNavigateBack) {
        when {
            activeTab != MobileTab.TRIPS -> activeTab = MobileTab.TRIPS
            tripsState.selectedTrip != null -> tripsModel.backToTrips()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        when {
                            !authState.signedIn -> "Rinde"
                            activeTab == MobileTab.EXPENSE ->
                                if (formState.isEditing) "Corregir gasto" else "Registrar gasto"
                            activeTab == MobileTab.INCIDENT ->
                                if (incidentFormState.isEditing) "Corregir incidencia" else "Reportar incidencia"
                            activeTab == MobileTab.QUEUE -> "Cola sin conexión"
                            activeTab == MobileTab.PROFILE -> "Perfil"
                            else -> tripsState.selectedTrip?.code ?: "Mis viajes"
                        },
                    )
                },
                navigationIcon = {
                    if (canNavigateBack) {
                        IconButton(
                            onClick = {
                                if (activeTab != MobileTab.TRIPS) {
                                    activeTab = MobileTab.TRIPS
                                } else {
                                    tripsModel.backToTrips()
                                }
                            },
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver")
                        }
                    }
                },
                actions = {
                    if (authState.signedIn) {
                        IconButton(
                            onClick = {
                                if (activeTab == MobileTab.PROFILE) {
                                    profileModel.loadProfile()
                                } else {
                                    tripsModel.loadTrips()
                                }
                                if (isOnline) queueModel.triggerSync(manual = false)
                            },
                            enabled = !tripsState.busy && !profileState.loading,
                        ) {
                            Icon(Icons.Default.Refresh, "Actualizar datos")
                        }
                    }
                },
            )
        },
        bottomBar = {
            if (authState.signedIn) {
                val tripTabLabel = if (tripsState.selectedTrip != null) "Viaje" else "Viajes"
                val expenseTabVisible =
                    tripsState.selectedTrip?.status == "IN_ROUTE" || formState.isEditing
                val queueTabLabel = if (queueState.pendingCount > 0) {
                    "Cola (${queueState.pendingCount})"
                } else {
                    "Cola"
                }

                NavigationBar {
                    NavigationBarItem(
                        selected = activeTab == MobileTab.TRIPS,
                        onClick = { activeTab = MobileTab.TRIPS },
                        icon = { Icon(Icons.Default.Place, tripTabLabel) },
                        label = { Text(tripTabLabel) },
                    )
                    if (expenseTabVisible) {
                        NavigationBarItem(
                            selected = activeTab == MobileTab.EXPENSE,
                            onClick = {
                                val trip = tripsState.selectedTrip
                                if (trip != null && !formState.isEditing) {
                                    formModel.prepareNew(trip)
                                }
                                activeTab = MobileTab.EXPENSE
                            },
                            icon = { Icon(Icons.Default.Add, "Gasto") },
                            label = { Text("Gasto") },
                        )
                    }
                    NavigationBarItem(
                        selected = activeTab == MobileTab.QUEUE,
                        onClick = { activeTab = MobileTab.QUEUE },
                        icon = { Icon(Icons.AutoMirrored.Filled.List, queueTabLabel) },
                        label = { Text(queueTabLabel) },
                    )
                    NavigationBarItem(
                        selected = activeTab == MobileTab.PROFILE,
                        onClick = { activeTab = MobileTab.PROFILE },
                        icon = { Icon(Icons.Default.Person, "Perfil") },
                        label = { Text("Perfil") },
                    )
                }
            }
        },
    ) { insets ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(insets)
                .imePadding()
                .verticalScroll(scroll)
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            if (authState.restoring ||
                authState.busy ||
                tripsState.busy ||
                queueState.busy ||
                profileState.loading
            ) {
                LinearProgressIndicator(Modifier.fillMaxWidth())
            }
            if (!isOnline && authState.signedIn && activeTab == MobileTab.TRIPS) {
                NoticeText("Sin señal. Los gastos e incidencias nuevas se guardarán en tu cola local.")
            }

            val topError = authState.error.ifBlank { tripsState.error }
            if (topError.isNotEmpty()) NoticeText(topError, error = true)
            val topMessage = authState.notice.ifBlank { tripsState.message }
            if (topMessage.isNotEmpty() && activeTab == MobileTab.TRIPS) NoticeText(topMessage)

            if (authState.restoring) {
                Text("Verificando sesión...")
            } else if (!authState.signedIn) {
                SignInScreen(
                    busy = authState.busy,
                    prefillEmail = authState.prefillEmail,
                    onSubmit = authModel::signIn,
                )
            } else {
                when (activeTab) {
                    MobileTab.TRIPS -> {
                        val selectedTrip = tripsState.selectedTrip
                        if (selectedTrip == null) {
                            TripsListScreen(
                                email = authState.session?.email.orEmpty(),
                                trips = tripsState.trips,
                                busy = tripsState.busy,
                                fromCache = tripsState.tripsFromCache,
                                onRefresh = tripsModel::loadTrips,
                                onOpenTrip = tripsModel::openTrip,
                            )
                        } else {
                            TripDetailScreen(
                                trip = selectedTrip,
                                vehicle = tripsState.vehicle,
                                loadingFinancials = tripsState.loadingFinancials,
                                advances = tripsState.advances,
                                advancesError = tripsState.advancesError,
                                settlementNotFound = tripsState.settlementNotFound,
                                settlementError = tripsState.settlementError,
                                financialSummary = tripsState.financialSummary,
                                busy = tripsState.busy,
                                isOnline = isOnline,
                                expenseError = tripsState.expenseError,
                                expenses = tripsState.displayExpenses,
                                tripIncidents = tripsState.tripIncidents,
                                activeSyncKeys = tripsState.activeSyncKeys,
                                onRequestStatusChange = { confirmAction = it },
                                onOpenExpenseForm = {
                                    formModel.prepareNew(selectedTrip)
                                    activeTab = MobileTab.EXPENSE
                                },
                                onOpenIncidentForm = {
                                    incidentFormModel.prepareNew(selectedTrip)
                                    activeTab = MobileTab.INCIDENT
                                },
                                onAttachPhotoToExpense = { remoteId ->
                                    attachTargetExpenseId = remoteId
                                },
                                onViewEvidence = tripsModel::viewEvidence,
                            )
                        }
                    }

                    MobileTab.EXPENSE -> {
                        val session = authState.session
                        ExpenseFormScreen(
                            state = formState,
                            isOnline = isOnline,
                            onCategoryChange = formModel::onCategoryChange,
                            onAmountChange = formModel::onAmountChange,
                            onDateChange = formModel::onDateChange,
                            onTakePhoto = { launchCamera(PhotoCaptureTarget.ExpenseForm) },
                            onPickGallery = { launchGallery(PhotoCaptureTarget.ExpenseForm) },
                            onRemovePhoto = formModel::removePhoto,
                            onSave = {
                                if (session != null) {
                                    formModel.save(
                                        session = session,
                                        trip = tripsState.selectedTrip,
                                        isOnline = isOnline,
                                    ) { feedback, shouldSync ->
                                        tripsModel.notifyMessage(feedback)
                                        if (shouldSync) {
                                            queueModel.triggerSync(manual = false)
                                        }
                                        activeTab = if (tripsState.selectedTrip != null) {
                                            MobileTab.TRIPS
                                        } else {
                                            MobileTab.QUEUE
                                        }
                                    }
                                }
                            },
                            onCancel = {
                                formModel.resetForm(tripsState.selectedTrip)
                                activeTab = if (tripsState.selectedTrip != null) {
                                    MobileTab.TRIPS
                                } else {
                                    MobileTab.QUEUE
                                }
                            },
                        )
                    }

                    MobileTab.INCIDENT -> {
                        val session = authState.session
                        IncidentFormScreen(
                            state = incidentFormState,
                            isOnline = isOnline,
                            onTypeChange = incidentFormModel::onTypeChange,
                            onDescriptionChange = incidentFormModel::onDescriptionChange,
                            onTakePhoto = { launchCamera(PhotoCaptureTarget.IncidentForm) },
                            onPickGallery = { launchGallery(PhotoCaptureTarget.IncidentForm) },
                            onRemovePhoto = incidentFormModel::removePhoto,
                            onSave = {
                                if (session != null) {
                                    incidentFormModel.save(
                                        session = session,
                                        trip = tripsState.selectedTrip,
                                        isOnline = isOnline,
                                    ) { feedback, shouldSync ->
                                        tripsModel.notifyMessage(feedback)
                                        if (shouldSync) {
                                            queueModel.triggerSync(manual = false)
                                        }
                                        activeTab = if (tripsState.selectedTrip != null) {
                                            MobileTab.TRIPS
                                        } else {
                                            MobileTab.QUEUE
                                        }
                                    }
                                }
                            },
                            onCancel = {
                                incidentFormModel.resetForm(tripsState.selectedTrip)
                                activeTab = if (tripsState.selectedTrip != null) {
                                    MobileTab.TRIPS
                                } else {
                                    MobileTab.QUEUE
                                }
                            },
                        )
                    }

                    MobileTab.QUEUE -> {
                        QueueScreen(
                            state = queueState,
                            isOnline = isOnline,
                            onRetryAll = { queueModel.triggerSync(manual = true) },
                            onRetrySingle = queueModel::retrySingle,
                            onEditRejected = { rejectedItem ->
                                if (rejectedItem.queueType == QueueItemType.INCIDENT) {
                                    incidentFormModel.prepareEdit(rejectedItem)
                                    activeTab = MobileTab.INCIDENT
                                } else {
                                    formModel.prepareEdit(rejectedItem)
                                    activeTab = MobileTab.EXPENSE
                                }
                            },
                            onDiscard = queueModel::discard,
                        )
                    }

                    MobileTab.PROFILE -> {
                        val isSyncing = queueState.busy || queueState.activeSyncKeys.isNotEmpty()
                        ProfileScreen(
                            profileState = profileState,
                            queueSummary = ProfileQueueSummary.from(queueState.items, isSyncing),
                            isOnline = isOnline,
                            isSyncing = isSyncing,
                            queueMessage = queueState.message,
                            queueError = queueState.error,
                            authBusy = authState.busy,
                            onRetry = profileModel::loadProfile,
                            onSendNow = { queueModel.triggerSync(manual = true) },
                            onOpenNotificationSettings = {
                                TripNotificationHelper.openChannelSettings(context)
                            },
                            onRequestSignOut = {
                                scope.launch {
                                    val pending = authModel.pendingCountBeforeSignOut()
                                    if (pending > 0) {
                                        confirmSignOutPending = pending
                                    } else {
                                        authModel.confirmSignOut()
                                    }
                                }
                            },
                        )
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }

    if (confirmAction.isNotEmpty()) {
        val starting = confirmAction == "start"
        AlertDialog(
            onDismissRequest = { confirmAction = "" },
            title = { Text(if (starting) "¿Iniciar este viaje?" else "¿Finalizar este viaje?") },
            text = {
                Text(
                    if (starting) {
                        "Operaciones verá que estás en ruta."
                    } else {
                        "El viaje quedará finalizado y operaciones podrá revisar la liquidación."
                    },
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        tripsModel.changeTripStatus(confirmAction)
                        confirmAction = ""
                    },
                ) {
                    Text(if (starting) "Iniciar viaje" else "Finalizar viaje")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmAction = "" }) { Text("Cancelar") }
            },
        )
    }

    if (confirmSignOutPending > 0) {
        AlertDialog(
            onDismissRequest = { confirmSignOutPending = -1 },
            title = { Text("Registros pendientes de envío") },
            text = {
                Text(
                    "Tienes $confirmSignOutPending registro(s) pendiente(s) en la cola sin conexión. " +
                        "Se conservarán guardados en este dispositivo para tu cuenta y se enviarán " +
                        "cuando vuelvas a ingresar.",
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmSignOutPending = -1
                        authModel.confirmSignOut()
                    },
                ) {
                    Text("Salir")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmSignOutPending = -1 }) { Text("Cancelar") }
            },
        )
    }

    val pendingAttachId = attachTargetExpenseId
    if (pendingAttachId != null) {
        AlertDialog(
            onDismissRequest = { attachTargetExpenseId = null },
            title = { Text("Adjuntar comprobante") },
            text = { Text("Elige cómo agregar la foto del comprobante para este gasto.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        attachTargetExpenseId = null
                        launchCamera(PhotoCaptureTarget.ExistingExpense(pendingAttachId))
                    },
                ) {
                    Text("Tomar foto")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        attachTargetExpenseId = null
                        launchGallery(PhotoCaptureTarget.ExistingExpense(pendingAttachId))
                    },
                ) {
                    Text("Elegir de galería")
                }
            },
        )
    }

    if (tripsState.viewingEvidenceTitle.isNotBlank()) {
        AlertDialog(
            onDismissRequest = tripsModel::dismissEvidenceDialog,
            title = { Text("Comprobante (${tripsState.viewingEvidenceTitle})") },
            text = {
                if (tripsState.loadingEvidence) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        LinearProgressIndicator(Modifier.fillMaxWidth())
                        Text("Cargando comprobante...")
                    }
                } else {
                    val bitmap = remember(
                        tripsState.viewingEvidenceLocalPath,
                        tripsState.viewingEvidenceBytes,
                    ) {
                        val path = tripsState.viewingEvidenceLocalPath
                        val bytes = tripsState.viewingEvidenceBytes
                        when {
                            !path.isNullOrBlank() -> runCatching { BitmapFactory.decodeFile(path) }.getOrNull()
                            bytes != null -> runCatching { BitmapFactory.decodeByteArray(bytes, 0, bytes.size) }.getOrNull()
                            else -> null
                        }
                    }
                    if (bitmap != null) {
                        Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = "Comprobante del gasto",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 160.dp, max = 360.dp),
                        )
                    } else {
                        Text("El comprobante no es una imagen previsualizable desde el móvil.")
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = tripsModel::dismissEvidenceDialog) {
                    Text("Cerrar")
                }
            },
        )
    }
}
