import React, { useState, useCallback } from "react"
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, ActivityIndicator, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useFocusEffect } from "expo-router"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { BRAND } from "@/utils/colors"
import { apiService } from "@/services/api"
import { cacheService } from "@/services/cache"
import { PaymentDetailsModal } from "../../components/PaymentDetailsModal"
import { formatCurrency, formatDate } from "@/utils/formatting"

interface Payment {
  id: string
  amount: number
  payment_method: string
  payment_reference: string
  status: "pending" | "completed" | "failed"
  payment_date: string
  confirmed_at?: string
  created_at: string
}

interface Statistics {
  total_payments: number
  completed: number
  pending: number
  failed: number
  total_amount_paid: number
  total_amount_pending: number
}

export default function PaymentHistoryScreen() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "failed">("all")

  const getCacheKey = (currentFilter: "all" | "pending" | "completed" | "failed") =>
    `driver_remittance_history_${currentFilter}`

  const fetchPayments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        const cached = await cacheService.get<{ payments: Payment[]; statistics: Statistics | null }>(
          getCacheKey(filter)
        )
        if (cached) {
          setPayments(cached.payments || [])
          setStatistics(cached.statistics || null)
          setLoading(false)
        } else {
          setLoading(true)
        }
      } else {
        setRefreshing(true)
      }

      const statusParam = filter === "all" ? undefined : filter
      const response = await apiService.get("/driver/payments/history", {
        params: {
          limit: 100,
          offset: 0,
          status: statusParam,
        },
      })

      if ((response as any)?.success) {
        const nextPayments = (((response as any).payments || []) as Payment[])
        const nextStatistics = (((response as any).statistics || null) as Statistics | null)
        setPayments(nextPayments)
        setStatistics(nextStatistics)
        await cacheService.set(getCacheKey(filter), {
          payments: nextPayments,
          statistics: nextStatistics,
        })
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter])

  useFocusEffect(
    useCallback(() => {
      fetchPayments()
    }, [fetchPayments])
  )

  const onRefresh = useCallback(async () => {
    await fetchPayments(false)
  }, [fetchPayments])

  const handlePaymentPress = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50"
      case "pending":
        return "#FFC107"
      case "failed":
        return "#F44336"
      default:
        return "#999"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "check-circle"
      case "pending":
        return "clock"
      case "failed":
        return "close-circle"
      default:
        return "help-circle"
    }
  }

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color || BRAND.primary }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: color || BRAND.primary }]}>{value}</Text>
    </View>
  )

  const PaymentItem = ({ payment }: { payment: Payment }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() => handlePaymentPress(payment)}
      activeOpacity={0.7}
    >
      <View style={styles.paymentLeft}>
        <MaterialCommunityIcons
          name={getStatusIcon(payment.status)}
          size={24}
          color={getStatusColor(payment.status)}
        />
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentReference}>Ref: {payment.payment_reference.slice(0, 12)}...</Text>
          <Text style={styles.paymentDate}>{formatDate(new Date(payment.payment_date))}</Text>
        </View>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
        <Text style={[styles.paymentStatus, { color: getStatusColor(payment.status) }]}>
          {payment.status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Statistics Section */}
        {statistics && (
          <View style={styles.statsContainer}>
            <StatCard
              label="Completed"
              value={formatCurrency(statistics.total_amount_paid)}
              color="#4CAF50"
            />
            <StatCard
              label="Pending"
              value={formatCurrency(statistics.total_amount_pending)}
              color="#FFC107"
            />
            <StatCard label="Total" value={`${statistics.total_payments} payments`} />
          </View>
        )}

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {(["all", "pending", "completed", "failed"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === f && styles.filterButtonTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payments List */}
        {payments.length > 0 ? (
          <View style={styles.paymentsContainer}>
            {payments.map((payment) => (
              <PaymentItem key={payment.id} payment={payment} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="receipt" size={48} color="#999" />
            <Text style={styles.emptyStateText}>No payment history found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === "all"
                ? "Your payments will appear here"
                : `No ${filter} payments found`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        visible={showDetails}
        payment={selectedPayment}
        onClose={() => setShowDetails(false)}
        onReverify={() => {
          setShowDetails(false)
          fetchPayments()
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#2a2a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3a",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statLabel: {
    color: "#999",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  filterButtonActive: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  filterButtonText: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#000",
  },
  paymentsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.primary,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentReference: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  paymentDate: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  paymentRight: {
    alignItems: "flex-end",
  },
  paymentAmount: {
    color: BRAND.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  paymentStatus: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: "#999",
    fontSize: 13,
    marginTop: 8,
  },
})
