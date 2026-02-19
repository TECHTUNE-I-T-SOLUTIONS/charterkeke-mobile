import React, { useState } from "react"
import { View, Modal, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { BRAND } from "@/utils/colors"
import { apiService } from "@/services/api"
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

interface PaymentDetailsModalProps {
  visible: boolean
  payment: Payment | null
  onClose: () => void
  onReverify?: () => void
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  visible,
  payment,
  onClose,
  onReverify,
}) => {
  const [reverifying, setReverifying] = useState(false)

  const handleReverify = async () => {
    if (!payment) return

    Alert.alert(
      "Reverify Payment",
      "Check the payment status with Paystack and update your records?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Reverify",
          onPress: async () => {
            try {
              setReverifying(true)
              const response = await apiService.post("/driver/settlement/verify", {
                reference: payment.payment_reference,
              })

              if ((response as any)?.success) {
                Alert.alert("Success", "Payment status updated successfully")
                onReverify?.()
              } else {
                Alert.alert(
                  "Payment Status",
                  `Current status: ${(response as any)?.paymentStatus || "Unknown"}`
                )
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.error || "Failed to reverify payment"
              )
            } finally {
              setReverifying(false)
            }
          },
        },
      ]
    )
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

  if (!payment) return null

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Status Card */}
          <View
            style={[
              styles.statusCard,
              { borderLeftColor: getStatusColor(payment.status) },
            ]}
          >
            <View style={styles.statusHeader}>
              <MaterialCommunityIcons
                name={getStatusIcon(payment.status)}
                size={40}
                color={getStatusColor(payment.status)}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>{payment.status.toUpperCase()}</Text>
                <Text style={styles.statusSubtitle}>
                  {payment.status === "completed"
                    ? "Payment processed successfully"
                    : payment.status === "pending"
                      ? "Waiting for payment confirmation"
                      : "Payment could not be processed"}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(payment.amount)}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Payment Information</Text>

            <DetailRow
              label="Reference"
              value={payment.payment_reference}
              copyable
              mono
            />
            <DetailRow
              label="Payment Method"
              value={payment.payment_method.toUpperCase()}
            />
            <DetailRow
              label="Payment Date"
              value={formatDate(new Date(payment.payment_date))}
            />

            {payment.confirmed_at && (
              <DetailRow
                label="Confirmed Date"
                value={formatDate(new Date(payment.confirmed_at))}
              />
            )}

            <DetailRow
              label="Created"
              value={formatDate(new Date(payment.created_at))}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {payment.status === "pending" && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleReverify}
                disabled={reverifying}
              >
                {reverifying ? (
                  <ActivityIndicator color={BRAND.primary} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="refresh" size={18} color={BRAND.primary} />
                    <Text style={styles.buttonTextSecondary}>Reverify with Paystack</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

interface DetailRowProps {
  label: string
  value: string
  copyable?: boolean
  mono?: boolean
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, copyable, mono }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (copyable) {
      // Copy to clipboard logic here
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <TouchableOpacity
      style={styles.detailRow}
      onPress={handleCopy}
      disabled={!copyable}
      activeOpacity={copyable ? 0.7 : 1}
    >
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={[styles.detailValue, mono && styles.detailValueMono]}>{value}</Text>
        {copyable && (
          <MaterialCommunityIcons
            name={copied ? "check" : "content-copy"}
            size={16}
            color={copied ? "#4CAF50" : "#999"}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </TouchableOpacity>
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
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  statusSubtitle: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  amountSection: {
    borderTopWidth: 1,
    borderTopColor: "#3a3a3a",
    paddingTop: 16,
  },
  amountLabel: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  amountValue: {
    color: BRAND.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  detailsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  detailLabel: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  detailValueMono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  actionsContainer: {
    gap: 12,
    marginTop: "auto",
  },
  button: {
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: BRAND.primary,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextSecondary: {
    color: BRAND.primary,
    fontSize: 16,
    fontWeight: "700",
  },
})
