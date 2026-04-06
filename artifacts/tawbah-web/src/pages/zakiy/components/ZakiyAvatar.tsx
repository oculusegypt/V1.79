export function ZakiyAvatar({ pulse = false, gender = "male" }: { pulse?: boolean; gender?: "male" | "female" }) {
  const avatarSrc = gender === "female" ? "/images/7686493.png" : "/images/zakiy-avatar.png";
  
  return (
    <div className="relative flex-shrink-0">
      <div
        className="relative w-10 h-10 rounded-full overflow-hidden"
        style={{
          boxShadow: pulse
            ? "0 0 0 2px rgba(255,255,255,0.9), 0 4px 16px rgba(5,150,105,0.5)"
            : "0 0 0 2px rgba(255,255,255,0.9), 0 3px 12px rgba(5,150,105,0.25)",
        }}
      >
        <img
          src={avatarSrc}
          alt="زكي"
          className="w-full h-full object-cover"
          style={{ background: gender === "female" ? "#fdf4ff" : "#1a3a2a" }}
        />
      </div>

      {!pulse && (
        <div
          className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-[2px] border-white"
          style={{ background: "#22c55e" }}
        />
      )}
    </div>
  );
}
