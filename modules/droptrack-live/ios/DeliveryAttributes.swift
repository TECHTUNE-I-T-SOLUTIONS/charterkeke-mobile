import ActivityKit
import Foundation

// IMPORTANT: This file is shared between the main app target (autolinked by
// expo-modules-autolinking) and the widget extension target (copied by the
// droptrack-live wrapper plugin). It MUST stay in sync with the copy in
// modules/droptrack-live/ios/Widget/DeliveryAttributes.swift. ActivityKit
// matches activities to their widget by the attributes type name; both
// targets need to declare the SAME struct name with the SAME shape.
struct DeliveryAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var status: String
        var progress: Double
        var eta: Date
        var stopsRemaining: Int
        var courierName: String
        var riderReassigned: Bool
    }
    var orderId: String
}
