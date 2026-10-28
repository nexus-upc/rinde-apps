package com.nexus.rinde.mobile.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import java.math.BigDecimal

class InputRulesTest {
    @Test fun `acepta decimal peruano sin alterar el valor`() {
        assertEquals(BigDecimal("180.50"), InputRules.amount("180,50"))
    }
    @Test fun `rechaza montos que el API no admite`() {
        listOf("0", "-1", "1.001", "100000000", "NaN", "1,000.50", "").forEach {
            assertThrows(IllegalArgumentException::class.java) { InputRules.amount(it) }
        }
    }
    @Test fun `la compilacion publicada exige HTTPS`() {
        assertThrows(IllegalArgumentException::class.java) {
            InputRules.serverUrl("http://10.0.2.2:8000", false)
        }
        assertEquals("https://api.rinde.test", InputRules.serverUrl("https://api.rinde.test/", false))
    }
    @Test fun `la direccion del servidor no admite credenciales ni parametros`() {
        listOf("https://user:pass@api.test", "https://api.test?token=secret", "https://api.test/#token", "https://api.test/api", "file:///data").forEach {
            assertThrows(IllegalArgumentException::class.java) { InputRules.serverUrl(it, true) }
        }
    }
    @Test fun `el entorno local se admite solo en pruebas`() {
        assertEquals("http://10.0.2.2:8000", InputRules.serverUrl("http://10.0.2.2:8000/", true))
    }
}
