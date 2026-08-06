import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getInitials } from '@/lib/get-initials';

type UserAvatarProps = {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  fallbackClassName?: string;
};

export function UserAvatar({
  user,
  size = 'default',
  className,
  fallbackClassName,
}: UserAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Avatar size={size} className={className}>
            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className={fallbackClassName}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        }
      />
      <TooltipContent>{user.email}</TooltipContent>
    </Tooltip>
  );
}
