package com.androidinstadm.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    DashboardScreen()
                }
            }
        }
    }
}

@Composable
private fun DashboardScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("AndroidInstadm", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Instagram messaging assistant",
            style = MaterialTheme.typography.titleMedium
        )

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Account connection", style = MaterialTheme.typography.titleLarge)
                Text("Not connected")
                Text(
                    "Connect a supported Instagram professional account after the secure backend and Meta OAuth flow are configured.",
                    style = MaterialTheme.typography.bodyMedium
                )
                Button(onClick = { /* OAuth flow will be added with backend */ }) {
                    Text("Connection setup coming soon")
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Automation overview", style = MaterialTheme.typography.titleLarge)
                Text("No automation rules configured.")
                Text(
                    "Future rules will process eligible inbound messages through the official Meta API.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Text(
            "Prototype build • API integration not enabled",
            style = MaterialTheme.typography.labelSmall
        )
    }
}
