import ActivityKit
import Foundation

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
