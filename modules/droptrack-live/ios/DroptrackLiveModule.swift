import ExpoModulesCore
import ActivityKit

public class DroptrackLiveModule: Module {
    public func definition() -> ModuleDefinition {
        Name("DroptrackLive")

        AsyncFunction("startDelivery") { (info: [String: Any], state: [String: Any]) -> String in
            guard #available(iOS 16.2, *) else { throw Exception(code: "UNSUPPORTED", description: "iOS < 16.2") }
            let attrs = DeliveryAttributes(orderId: info["orderId"] as? String ?? "")
            let content = DeliveryAttributes.ContentState(
                status: state["status"] as? String ?? "",
                progress: state["progress"] as? Double ?? 0,
                eta: Date(timeIntervalSince1970: (state["etaEpochMillis"] as? Double ?? 0) / 1000),
                stopsRemaining: state["stopsRemaining"] as? Int ?? 0,
                courierName: state["courierName"] as? String ?? "",
                riderReassigned: state["riderReassigned"] as? Bool ?? false
            )
            let activity = try Activity.request(attributes: attrs, content: ActivityContent(state: content, staleDate: nil), pushType: .token)
            return activity.id
        }

        AsyncFunction("updateDelivery") { (activityId: String, state: [String: Any]) in
            guard #available(iOS 16.2, *) else { return }
            guard let activity = Activity<DeliveryAttributes>.activities.first(where: { $0.id == activityId }) else { throw Exception(code: "NOT_FOUND", description: "Activity not found") }
            let content = DeliveryAttributes.ContentState(
                status: state["status"] as? String ?? "",
                progress: state["progress"] as? Double ?? 0,
                eta: Date(timeIntervalSince1970: (state["etaEpochMillis"] as? Double ?? 0) / 1000),
                stopsRemaining: state["stopsRemaining"] as? Int ?? 0,
                courierName: state["courierName"] as? String ?? "",
                riderReassigned: state["riderReassigned"] as? Bool ?? false
            )
            await activity.update(ActivityContent(state: content, staleDate: nil))
        }

        AsyncFunction("endDelivery") { (activityId: String, state: [String: Any], dismissAfterSeconds: Double) in
            guard #available(iOS 16.2, *) else { return }
            guard let activity = Activity<DeliveryAttributes>.activities.first(where: { $0.id == activityId }) else { return }
            let content = DeliveryAttributes.ContentState(
                status: state["status"] as? String ?? "",
                progress: state["progress"] as? Double ?? 0,
                eta: Date(timeIntervalSince1970: (state["etaEpochMillis"] as? Double ?? 0) / 1000),
                stopsRemaining: state["stopsRemaining"] as? Int ?? 0,
                courierName: state["courierName"] as? String ?? "",
                riderReassigned: state["riderReassigned"] as? Bool ?? false
            )
            await activity.end(ActivityContent(state: content, staleDate: nil), dismissalPolicy: .after(Date().addingTimeInterval(dismissAfterSeconds > 0 ? dismissAfterSeconds : 4*3600)))
        }

        Function("isSupported") { () -> Bool in
            if #available(iOS 16.2, *) { return true }
            return false
        }

        Function("areActivitiesEnabled") { () -> Bool in
            if #available(iOS 16.2, *) { return ActivityAuthorizationInfo().areActivitiesEnabled }
            return false
        }
    }
}
