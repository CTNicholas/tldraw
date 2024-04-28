/* eslint-disable react-hooks/rules-of-hooks */
import {
	Circle2d,
	Polygon2d,
	SVGContainer,
	ShapeUtil,
	TLDrawShapeSegment,
	TLHighlightShape,
	TLOnResizeHandler,
	VecLike,
	highlightShapeMigrations,
	highlightShapeProps,
	last,
	rng,
} from '@tldraw/editor'
import { tldrawConstants } from '../../tldraw-constants'
import { getPointsFromSegments } from '../draw/getPath'
import { useDefaultColorTheme } from '../shared/ShapeFill'
import { getStrokeOutlinePoints } from '../shared/freehand/getStrokeOutlinePoints'
import { getStrokePoints } from '../shared/freehand/getStrokePoints'
import { setStrokePointRadii } from '../shared/freehand/setStrokePointRadii'
import { getSvgPathFromStrokePoints } from '../shared/freehand/svg'
import { StrokeOptions } from '../shared/freehand/types'
import { useColorSpace } from '../shared/useColorSpace'
import { useForceSolid } from '../shared/useForceSolid'
const { FREEHAND_OPTIONS, FONT_SIZES, HIGHLIGHT_OVERLAY_OPACITY, HIGHLIGHT_UNDERLAY_OPACITY } =
	tldrawConstants
const { highlight } = FREEHAND_OPTIONS

/** @public */
export class HighlightShapeUtil extends ShapeUtil<TLHighlightShape> {
	static override type = 'highlight' as const
	static override props = highlightShapeProps
	static override migrations = highlightShapeMigrations

	override hideResizeHandles = (shape: TLHighlightShape) => getIsDot(shape)
	override hideRotateHandle = (shape: TLHighlightShape) => getIsDot(shape)
	override hideSelectionBoundsFg = (shape: TLHighlightShape) => getIsDot(shape)

	override getDefaultProps(): TLHighlightShape['props'] {
		return {
			segments: [],
			color: 'black',
			size: 'm',
			isComplete: false,
			isPen: false,
		}
	}

	getGeometry(shape: TLHighlightShape) {
		const strokeWidth = getStrokeWidth(shape)
		if (getIsDot(shape)) {
			return new Circle2d({
				x: -strokeWidth / 2,
				y: -strokeWidth / 2,
				radius: strokeWidth / 2,
				isFilled: true,
			})
		}

		const { strokePoints, sw } = getHighlightStrokePoints(shape, strokeWidth, true)
		const opts: StrokeOptions = { ...highlight(sw), last: true }
		setStrokePointRadii(strokePoints, opts)
		return new Polygon2d({
			points: getStrokeOutlinePoints(strokePoints, opts),
			isFilled: true,
		})
	}

	component(shape: TLHighlightShape) {
		return (
			<SVGContainer id={shape.id} style={{ opacity: HIGHLIGHT_OVERLAY_OPACITY }}>
				<HighlightRenderer strokeWidth={getStrokeWidth(shape)} shape={shape} />
			</SVGContainer>
		)
	}

	override backgroundComponent(shape: TLHighlightShape) {
		return (
			<SVGContainer id={shape.id} style={{ opacity: HIGHLIGHT_UNDERLAY_OPACITY }}>
				<HighlightRenderer strokeWidth={getStrokeWidth(shape)} shape={shape} />
			</SVGContainer>
		)
	}

	indicator(shape: TLHighlightShape) {
		const forceSolid = useForceSolid()
		const strokeWidth = getStrokeWidth(shape)
		const allPointsFromSegments = getPointsFromSegments(shape.props.segments)

		let sw = strokeWidth
		if (!forceSolid && !shape.props.isPen && allPointsFromSegments.length === 1) {
			sw += rng(shape.id)() * (strokeWidth / 6)
		}

		const strokePoints = getStrokePoints(allPointsFromSegments, {
			...highlight(sw),
			last: shape.props.isComplete || last(shape.props.segments)?.type === 'straight',
		})

		let strokePath
		if (strokePoints.length < 2) {
			strokePath = getIndicatorDot(allPointsFromSegments[0], sw)
		} else {
			strokePath = getSvgPathFromStrokePoints(strokePoints, false)
		}

		return <path d={strokePath} />
	}

	override toSvg(shape: TLHighlightShape) {
		return (
			<HighlightRenderer
				strokeWidth={getStrokeWidth(shape)}
				shape={shape}
				opacity={HIGHLIGHT_OVERLAY_OPACITY}
			/>
		)
	}

	override toBackgroundSvg(shape: TLHighlightShape) {
		return (
			<HighlightRenderer
				strokeWidth={getStrokeWidth(shape)}
				shape={shape}
				opacity={HIGHLIGHT_UNDERLAY_OPACITY}
			/>
		)
	}

	override onResize: TLOnResizeHandler<TLHighlightShape> = (shape, info) => {
		const { scaleX, scaleY } = info

		const newSegments: TLDrawShapeSegment[] = []

		for (const segment of shape.props.segments) {
			newSegments.push({
				...segment,
				points: segment.points.map(({ x, y, z }) => {
					return {
						x: scaleX * x,
						y: scaleY * y,
						z,
					}
				}),
			})
		}

		return {
			props: {
				segments: newSegments,
			},
		}
	}
}

function getShapeDot(point: VecLike) {
	const r = 0.1
	return `M ${point.x} ${point.y} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${
		r * 2
	},0`
}

function getIndicatorDot(point: VecLike, sw: number) {
	const r = sw / 2
	return `M ${point.x} ${point.y} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${
		r * 2
	},0`
}

function getHighlightStrokePoints(
	shape: TLHighlightShape,
	strokeWidth: number,
	forceSolid: boolean
) {
	const allPointsFromSegments = getPointsFromSegments(shape.props.segments)

	let sw = strokeWidth
	if (!forceSolid && !shape.props.isPen && allPointsFromSegments.length === 1) {
		sw += rng(shape.id)() * (strokeWidth / 6)
	}

	const strokePoints = getStrokePoints(allPointsFromSegments, {
		...highlight(sw),
		last: shape.props.isComplete || last(shape.props.segments)?.type === 'straight',
	})

	return { strokePoints, sw }
}

function getHighlightSvgPath(shape: TLHighlightShape, strokeWidth: number, forceSolid: boolean) {
	const { strokePoints, sw } = getHighlightStrokePoints(shape, strokeWidth, forceSolid)

	const solidStrokePath =
		strokePoints.length > 1
			? getSvgPathFromStrokePoints(strokePoints, false)
			: getShapeDot(shape.props.segments[0].points[0])

	return { solidStrokePath, sw }
}

function HighlightRenderer({
	strokeWidth,
	shape,
	opacity,
}: {
	strokeWidth: number
	shape: TLHighlightShape
	opacity?: number
}) {
	const theme = useDefaultColorTheme()
	const forceSolid = useForceSolid()
	const { solidStrokePath, sw } = getHighlightSvgPath(shape, strokeWidth, forceSolid)
	const colorSpace = useColorSpace()
	const color = theme[shape.props.color].highlight[colorSpace]

	return (
		<path
			d={solidStrokePath}
			strokeLinecap="round"
			fill="none"
			pointerEvents="all"
			stroke={color}
			strokeWidth={sw}
			opacity={opacity}
		/>
	)
}

function getStrokeWidth(shape: TLHighlightShape) {
	return FONT_SIZES[shape.props.size] * 1.12
}

function getIsDot(shape: TLHighlightShape) {
	return shape.props.segments.length === 1 && shape.props.segments[0].points.length < 2
}
