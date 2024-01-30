import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

export default function AssetPropsExample() {
	return (
		<Tldraw
			// only allow jpegs
			acceptedImageMimeTypes={['image/jpeg']}
			// don't allow any videos
			acceptedVideoMimeTypes={[]}
			// accept images of any dimension
			maxImageDimension={Infinity}
			// ...but only accept assets up to 1mb
			maxAssetSize={1 * 1024 * 1024}
		/>
	)
}

/* 
This example shows how to use props on the Tldraw component to control what types of
assets can be uploaded.

*/
