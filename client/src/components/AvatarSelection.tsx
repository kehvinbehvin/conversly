import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AVATARS } from "@shared/schema";

interface AvatarSelectionProps {
  selectedAvatar: Avatar;
  onAvatarSelect: (avatar: Avatar) => void;
}

export default function AvatarSelection({
  selectedAvatar,
  onAvatarSelect,
}: AvatarSelectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-heading-2 text-warm-brown-800 text-center">
        Select an avatar to talk to
      </h3>
      
      {/* Desktop & Tablet: 2x2 Grid */}
      <div className="hidden sm:grid grid-cols-2 gap-3">
        {AVATARS.map((avatar) => (
          <AvatarCard
            key={avatar.agent_id}
            avatar={avatar}
            isSelected={selectedAvatar.agent_id === avatar.agent_id}
            onSelect={() => onAvatarSelect(avatar)}
          />
        ))}
      </div>

      {/* Mobile: Vertical Stack */}
      <div className="sm:hidden space-y-3">
        {AVATARS.map((avatar) => (
          <AvatarCard
            key={avatar.agent_id}
            avatar={avatar}
            isSelected={selectedAvatar.agent_id === avatar.agent_id}
            onSelect={() => onAvatarSelect(avatar)}
          />
        ))}
      </div>
    </div>
  );
}

interface AvatarCardProps {
  avatar: Avatar;
  isSelected: boolean;
  onSelect: () => void;
}

function AvatarCard({ avatar, isSelected, onSelect }: AvatarCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? "ring-2 ring-coral-500 bg-gradient-to-r from-coral-50 to-sage-50 border-coral-200"
          : "border-warm-brown-200 hover:border-coral-300"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* Profile Image */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-sage-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {avatar.name.charAt(0)}
            </span>
          </div>
          
          {/* Name and Description */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-warm-brown-800 text-sm leading-tight truncate">
              {avatar.name}
            </h4>
            <p className="text-warm-brown-600 text-xs leading-tight truncate">
              {avatar.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}