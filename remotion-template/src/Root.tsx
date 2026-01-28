import React from 'react';
import {Composition} from 'remotion';
import {CaptionedClip, captionedClipSchema, defaultCaptionedClipProps} from './compositions/CaptionedClip';
import {SimplePromo, simplePromoSchema, defaultSimplePromoProps} from './compositions/SimplePromo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CaptionedClip"
        component={CaptionedClip}
        durationInFrames={30 * 15}
        fps={30}
        width={1080}
        height={1920}
        schema={captionedClipSchema}
        defaultProps={defaultCaptionedClipProps}
      />
      <Composition
        id="SimplePromo"
        component={SimplePromo}
        durationInFrames={30 * 12}
        fps={30}
        width={1920}
        height={1080}
        schema={simplePromoSchema}
        defaultProps={defaultSimplePromoProps}
      />
    </>
  );
};
