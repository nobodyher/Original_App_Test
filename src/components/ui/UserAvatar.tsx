import React from "react";

interface UserAvatarProps {
  image?: string | null;
  name: string;
  size?: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  image,
  name,
  size = "w-10 h-10",
  className = "",
}) => {
  // Calcular iniciales del nombre
  const getInitials = (fullName: string): string => {
    const words = fullName.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`${size} rounded-full overflow-hidden flex items-center justify-center ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full rounded-full object-cover object-center shadow-sm"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-white text-primary-600 font-bold flex items-center justify-center text-sm">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};
