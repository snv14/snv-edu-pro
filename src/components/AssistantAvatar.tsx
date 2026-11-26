import React from 'react';
import { Sprout } from 'lucide-react';

/** The same modern science robot is used on the dashboard and in the chat. */
export const AssistantAvatar: React.FC<{
  size?: 'hero' | 'small' | 'medium' | 'large';
}> = ({ size = 'medium' }) => {
  const robot = (
    <div className="overview-robot" aria-hidden="true">
      <span className="overview-robot__antenna" />
      <div className="overview-robot__head">
        <div>
          <i />
          <i />
        </div>
      </div>
      <div className="overview-robot__body">
        <Sprout size={29} />
      </div>
      <span className="overview-robot__arm" />
      <span className="overview-robot__spark">✦</span>
    </div>
  );
  return size === 'hero' ? (
    robot
  ) : (
    <div
      className={`assistant-avatar assistant-avatar--${size}`}
      aria-hidden="true"
    >
      {robot}
    </div>
  );
};
