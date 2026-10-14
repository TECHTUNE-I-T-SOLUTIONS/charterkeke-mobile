import ActivityKit
import WidgetKit
import SwiftUI

struct DeliveryLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DeliveryAttributes.self) { context in
            DeliveryCardView(context: context)
                .activityBackgroundTint(Color(red: 0.07, green: 0.07, blue: 0.12))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "bicycle").foregroundStyle(.orange)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.status).font(.callout.bold())
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.courierName).font(.callout.weight(.semibold)).lineLimit(1)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 4) {
                        SegmentedProgressBar(progress: context.state.progress)
                        HStack {
                            Text("\(Int(context.state.progress * 100))%")
                            Spacer()
                            Text("\(context.state.stopsRemaining) stops")
                        }.font(.caption2).foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: "bicycle").foregroundStyle(.orange)
            } compactTrailing: {
                Text("\(Int(context.state.progress * 100))%").font(.caption2.bold())
            } minimal: {
                Image(systemName: "bicycle").foregroundStyle(.orange)
            }
            .keylineTint(.orange)
        }
    }
}

struct DeliveryCardView: View {
    let context: ActivityViewContext<DeliveryAttributes>
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(context.state.status)
                    .font(.headline)
                    .lineLimit(1)
                Spacer()
                Text("\(context.state.stopsRemaining) stops away")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            SegmentedProgressBar(progress: context.state.progress)
            HStack {
                Text(context.state.courierName)
                    .font(.subheadline)
                Spacer()
                Text("ETA \(context.state.eta, style: .time)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }
}

struct SegmentedProgressBar: View {
    let progress: Double
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<7, id: \.self) { i in
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .fill(i < Int(min(7, max(0, Int((progress * 7).rounded(.up))))) ? .orange : Color.gray.opacity(0.3))
                    .frame(height: 6)
            }
        }
    }
}
