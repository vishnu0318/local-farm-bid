
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Notification } from '@/types/marketplace';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationsDropdownProps {
  notifications: Notification[];
  userRole?: string;
  unreadCount?: number;
  markAllAsRead?: () => void;
  isMobile?: boolean;
  onNotificationUpdate?: () => void;
}

const NotificationsDropdown = ({ 
  notifications, 
  userRole,
  unreadCount = 0, 
  markAllAsRead = () => {}, 
  isMobile = false,
  onNotificationUpdate = () => {}
}: NotificationsDropdownProps) => {
  const actualUnreadCount = notifications.filter(n => !n.is_read).length;
  const displayUnreadCount = unreadCount || actualUnreadCount;

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadNotifications.map(n => n.id));

      if (error) throw error;

      toast.success('All notifications marked as read');
      markAllAsRead();
      onNotificationUpdate();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);

        if (error) throw error;
        onNotificationUpdate();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full p-2 text-gray-400 hover:text-gray-500 focus:outline-none">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" />
          {displayUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white border border-gray-200 shadow-lg">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {displayUnreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="text-center py-4 text-gray-500">
              No notifications
            </div>
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex-1">
                  <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-normal'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
