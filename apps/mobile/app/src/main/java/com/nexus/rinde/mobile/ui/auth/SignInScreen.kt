package com.nexus.rinde.mobile.ui.auth

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.BuildConfig

@Composable
fun SignInScreen(
    busy: Boolean,
    prefillEmail: String,
    onSubmit: (String, String, String) -> Unit,
) {
    var email by rememberSaveable { mutableStateOf(prefillEmail) }
    var password by remember { mutableStateOf("") }
    var server by rememberSaveable {
        mutableStateOf(if (BuildConfig.DEBUG) "http://10.0.2.2:8000" else "")
    }
    var connectionOpen by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(prefillEmail) {
        if (prefillEmail.isNotBlank() && email.isBlank()) {
            email = prefillEmail
        }
    }

    Spacer(Modifier.height(24.dp))
    Text("Tu viaje, a mano.", style = MaterialTheme.typography.headlineLarge)
    Text("Ingresa con la cuenta de conductor que te asignó tu empresa.")
    OutlinedTextField(
        value = email,
        onValueChange = { email = it },
        label = { Text("Correo electrónico") },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        singleLine = true,
        enabled = !busy,
        modifier = Modifier.fillMaxWidth(),
    )
    OutlinedTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text("Contraseña") },
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        singleLine = true,
        enabled = !busy,
        modifier = Modifier.fillMaxWidth(),
    )
    Button(
        onClick = { onSubmit(server, email, password) },
        enabled = !busy && email.isNotBlank() && password.isNotBlank(),
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 48.dp),
    ) {
        Text("Ingresar")
    }
    TextButton(onClick = { connectionOpen = !connectionOpen }) {
        Text("Conexión de prueba")
    }
    if (connectionOpen) {
        OutlinedTextField(
            value = server,
            onValueChange = { server = it },
            label = { Text("Servidor de Rinde") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            singleLine = true,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        )
        Text(
            "En un teléfono usa la dirección del servidor de prueba. " +
                "La dirección inicial corresponde al emulador de esta PC.",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}
