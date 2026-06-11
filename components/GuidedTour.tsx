import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, InteractionManager, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { BRAND } from '@/utils/colors';

export type TourStep = {
  id: string;
  title: string;
  body: string;
};

type TargetFrame = { x: number; y: number; width: number; height: number };

type GuidedTourContextValue = {
  registerTarget: (id: string, ref: View | null) => void;
  startTour: (steps: TourStep[], onDone?: () => void) => void;
  stopTour: () => void;
  activeTargetId?: string;
  refreshTarget: (id: string) => void;
};

const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);

export function useGuidedTour() {
  const value = useContext(GuidedTourContext);
  if (!value) {
    throw new Error('useGuidedTour must be used inside GuidedTourProvider');
  }
  return value;
}

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const targets = useRef<Record<string, View | null>>({});
  const doneRef = useRef<(() => void) | undefined>(undefined);
  const activeStepIdRef = useRef<string | undefined>(undefined);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState<TargetFrame | null>(null);

  const activeStep = steps[index];
  activeStepIdRef.current = activeStep?.id;

  const measureStep = useCallback((step?: TourStep, attempt = 0) => {
    if (!step) return;
    const target = targets.current[step.id];
    if (!target) {
      setFrame(null);
      return;
    }
    const setMeasuredFrame = (x: number, y: number, width: number, height: number) => {
      if (activeStepIdRef.current !== step.id) return;
      if (width > 0 && height > 0) {
        setFrame({ x, y, width, height });
      } else if (attempt < 4) {
        setTimeout(() => measureStep(step, attempt + 1), 120);
      } else {
        setFrame(null);
      }
    };

    const runMeasure = () => requestAnimationFrame(() => {
      if (activeStepIdRef.current !== step.id) return;
      target.measure((_x, _y, width, height, pageX, pageY) => {
        if (activeStepIdRef.current !== step.id) return;
        if (width > 0 && height > 0 && Number.isFinite(pageX) && Number.isFinite(pageY)) {
          setMeasuredFrame(pageX, pageY, width, height);
          return;
        }

        target.measureInWindow((x, y, fallbackWidth, fallbackHeight) => {
          if (activeStepIdRef.current !== step.id) return;
          setMeasuredFrame(x, y, fallbackWidth, fallbackHeight);
        });
      });
    });
    InteractionManager.runAfterInteractions(runMeasure);
  }, []);

  const registerTarget = useCallback((id: string, ref: View | null) => {
    targets.current[id] = ref;
    if (activeStep?.id === id) {
      measureStep(activeStep);
    }
  }, [activeStep, measureStep]);

  const stopTour = useCallback(() => {
    setSteps([]);
    setIndex(0);
    setFrame(null);
    doneRef.current?.();
    doneRef.current = undefined;
  }, []);

  const startTour = useCallback((nextSteps: TourStep[], onDone?: () => void) => {
    if (!nextSteps.length) return;
    doneRef.current = onDone;
    setSteps(nextSteps);
    setIndex(0);
    setTimeout(() => measureStep(nextSteps[0]), 350);
  }, [measureStep]);

  const goTo = useCallback((nextIndex: number) => {
    const nextStep = steps[nextIndex];
    setIndex(nextIndex);
    setFrame(null);
    setTimeout(() => measureStep(nextStep), 220);
  }, [measureStep, steps]);

  const refreshTarget = useCallback((id: string) => {
    if (activeStep?.id === id) {
      setTimeout(() => measureStep(activeStep), 60);
    }
  }, [activeStep, measureStep]);

  useEffect(() => {
    if (!activeStep) return;
    const timers = [80, 260, 520].map((delay) => setTimeout(() => measureStep(activeStep), delay));
    return () => timers.forEach(clearTimeout);
  }, [activeStep, measureStep]);

  const value = useMemo(
    () => ({ registerTarget, startTour, stopTour, activeTargetId: activeStep?.id, refreshTarget }),
    [activeStep?.id, refreshTarget, registerTarget, startTour, stopTour]
  );

  const padded = frame
    ? {
        x: Math.max(8, frame.x - 8),
        y: Math.max(8, frame.y - 8),
        width: frame.width + 16,
        height: frame.height + 16,
      }
    : null;

  const screenHeight = Dimensions.get('window').height;
  const tooltipTop = padded
    ? padded.y > screenHeight * 0.52
      ? Math.max(70, padded.y - 205)
      : Math.min(padded.y + padded.height + 18, screenHeight - 235)
    : 220;

  return (
    <GuidedTourContext.Provider value={value}>
      {children}
      <Modal visible={Boolean(activeStep)} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay} pointerEvents="box-none">
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <Mask id="tourMask">
                <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                {padded && (
                  <Rect
                    x={padded.x}
                    y={padded.y}
                    width={padded.width}
                    height={padded.height}
                    rx={18}
                    ry={18}
                    fill="black"
                  />
                )}
              </Mask>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tourMask)" />
          </Svg>

          {padded && (
            <View
              pointerEvents="none"
              style={[
                styles.focusRing,
                { left: padded.x, top: padded.y, width: padded.width, height: padded.height },
              ]}
            />
          )}

          <View style={[styles.tooltip, { top: tooltipTop }]}>
            <Text style={styles.stepCount}>{index + 1} of {steps.length}</Text>
            <Text style={styles.title}>{activeStep?.title}</Text>
            <Text style={styles.body}>{activeStep?.body}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={stopTour} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Skip</Text>
              </TouchableOpacity>
              <View style={styles.rightActions}>
                {index > 0 && (
                  <TouchableOpacity onPress={() => goTo(index - 1)} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => (index >= steps.length - 1 ? stopTour() : goTo(index + 1))}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryText}>{index >= steps.length - 1 ? 'Done' : 'Next'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </GuidedTourContext.Provider>
  );
}

export function TourTarget({ id, children, style }: { id: string; children: ReactNode; style?: any }) {
  const { activeTargetId, refreshTarget, registerTarget } = useGuidedTour();
  return (
    <View
      ref={(ref) => registerTarget(id, ref)}
      collapsable={false}
      onLayout={() => {
        if (activeTargetId === id) refreshTarget(id);
      }}
      style={style}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  focusRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: BRAND.primary,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  stepCount: { color: BRAND.primary, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  title: { color: '#111827', fontSize: 19, fontWeight: '900', marginBottom: 8 },
  body: { color: '#4B5563', fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  rightActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  secondaryBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  secondaryText: { color: '#6B7280', fontSize: 14, fontWeight: '800' },
  primaryBtn: { backgroundColor: BRAND.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11 },
  primaryText: { color: '#111827', fontSize: 14, fontWeight: '900' },
});
