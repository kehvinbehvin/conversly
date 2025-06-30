import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface ConversationAvatarProps {
  type: 'user' | 'agent';
  isSpeaking: boolean;
  avatarImage?: string;
  avatarName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16", 
  lg: "h-20 w-20"
};

const borderClasses = {
  speaking: "ring-4 ring-coral-500 ring-opacity-75",
  idle: "ring-4 ring-transparent"
};

export default function ConversationAvatar({
  type,
  isSpeaking,
  avatarImage,
  avatarName,
  size = 'md'
}: ConversationAvatarProps) {
  const getUserAvatar = () => {
    // Generic hardcoded user avatar as specified in requirements
    return "/user-avatar.svg"; // We'll create this asset
  };

  const getAvatarImage = () => {
    return type === 'user' ? getUserAvatar() : avatarImage;
  };

  const getAvatarFallback = () => {
    if (type === 'user') {
      return <User className="h-8 w-8 text-gray-500" />;
    }
    return avatarName?.charAt(0).toUpperCase() || "A";
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Avatar 
        className={`
          ${sizeClasses[size]} 
          transition-all duration-200 
          ${isSpeaking ? borderClasses.speaking : borderClasses.idle}
        `}
      >
        <AvatarImage 
          src={getAvatarImage()} 
          alt={type === 'user' ? 'User' : avatarName || 'Agent'} 
        />
        <AvatarFallback className="bg-gray-100">
          {getAvatarFallback()}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-center">
        <p className="text-xs font-medium text-gray-600">
          {type === 'user' ? 'You' : (avatarName || 'Agent')}
        </p>
        <p className={`text-xs text-coral-600 font-semibold ${isSpeaking ? 'visible' : 'invisible'}`}>
          Speaking...
        </p>
      </div>
    </div>
  );
}