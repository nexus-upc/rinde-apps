package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.remote.Settlement
import com.nexus.rinde.mobile.data.remote.TripAdvance
import java.math.BigDecimal

data class TripFinancialSummary(
    val hasOfficialSettlement: Boolean,
    val settlementStatus: String,
    val currency: String,
    val advanceTotal: BigDecimal,
    val approvedExpensesTotal: BigDecimal,
    val registeredExpensesTotal: BigDecimal,
    val balance: BigDecimal,
    val queuedExpensesCount: Int,
)

object TripFinancialCalculator {
    fun calculate(
        settlement: Settlement?,
        advances: List<TripAdvance>,
        expenses: List<TripExpenseDisplayItem>,
    ): TripFinancialSummary {
        val advancesSum = advances.fold(BigDecimal.ZERO) { acc, item ->
            acc + (item.amount.toBigDecimalOrNull() ?: BigDecimal.ZERO)
        }
        val approvedSum = expenses
            .filter { it.backendStatus == "APPROVED" }
            .fold(BigDecimal.ZERO) { acc, item ->
                acc + (item.amount.toBigDecimalOrNull() ?: BigDecimal.ZERO)
            }
        val registeredSum = expenses
            .filter { item ->
                item.queueStatus != QueueItemStatus.REJECTED && item.backendStatus != "OBSERVED"
            }
            .fold(BigDecimal.ZERO) { acc, item ->
                acc + (item.amount.toBigDecimalOrNull() ?: BigDecimal.ZERO)
            }
        val queuedCount = expenses.count {
            it.queueStatus != null && it.queueStatus != QueueItemStatus.SYNCED
        }

        val defaultCurrency = settlement?.advanceCurrency?.ifBlank { null }
            ?: settlement?.expenseTotalCurrency?.ifBlank { null }
            ?: advances.firstOrNull()?.currency?.ifBlank { null }
            ?: expenses.firstOrNull()?.currency?.ifBlank { null }
            ?: "PEN"

        if (settlement != null) {
            val officialAdvance = settlement.advanceAmount.toBigDecimalOrNull() ?: advancesSum
            val officialExpenses = settlement.expenseTotalAmount.toBigDecimalOrNull() ?: approvedSum
            val officialBalance = settlement.advanceBalance.toBigDecimalOrNull()
                ?: officialAdvance.subtract(officialExpenses)
            return TripFinancialSummary(
                hasOfficialSettlement = true,
                settlementStatus = settlement.status,
                currency = defaultCurrency,
                advanceTotal = officialAdvance,
                approvedExpensesTotal = officialExpenses,
                registeredExpensesTotal = registeredSum,
                balance = officialBalance,
                queuedExpensesCount = queuedCount,
            )
        }

        return TripFinancialSummary(
            hasOfficialSettlement = false,
            settlementStatus = "",
            currency = defaultCurrency,
            advanceTotal = advancesSum,
            approvedExpensesTotal = approvedSum,
            registeredExpensesTotal = registeredSum,
            balance = advancesSum.subtract(registeredSum),
            queuedExpensesCount = queuedCount,
        )
    }
}
