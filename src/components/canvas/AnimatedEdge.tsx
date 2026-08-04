import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

/** Edge customizada que “pisca” pacotes durante picos de carga. */
export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        {...(markerEnd !== undefined ? { markerEnd } : {})}
        style={{
          ...style,
          stroke: isLoadActive ? '#22d3ee' : '#475569',
          strokeWidth: isLoadActive ? 2.25 : 1.5,
        }}
        className={cn(isLoadActive && 'hf-edge-pulse')}
      />
      {isLoadActive && (
        <>
          <circle r="3.5" fill="#67e8f9" className="hf-packet">
            <animateMotion dur="1.1s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="2.5" fill="#a5f3fc" className="hf-packet" opacity="0.7">
            <animateMotion dur="1.1s" begin="0.35s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="2" fill="#ecfeff" className="hf-packet" opacity="0.5">
            <animateMotion dur="1.1s" begin="0.7s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}
    </>
  )
}

export const edgeTypes = {
  animated: AnimatedEdge,
} as const
