import {
  KnockProvider,
  KnockFeedProvider,
  NotificationFeed,
  NotificationIconButton,
} from "@knocklabs/react";

import "@knocklabs/react/dist/index.css";

const NotificationInbox = ({ user, feedId, apiKey }) => {
  return (
    <KnockProvider apiKey={apiKey} userId={user.id}>
      <KnockFeedProvider feedId={feedId}>
        <>
          <NotificationIconButton badgeCountType="unread" />
          <NotificationFeed />
        </>
      </KnockFeedProvider>
    </KnockProvider>
  );
};
export default NotificationInbox;
