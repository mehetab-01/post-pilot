import { PLATFORMS } from './constants'
import { PlatformCard } from './PlatformCard'

export function PlatformSelector({ selectedPlatforms, onToggle, onToneChange, onOptionChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {PLATFORMS.map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          isSelected={!!selectedPlatforms[platform.id]}
          selection={selectedPlatforms[platform.id]}
          onToggle={onToggle}
          onToneChange={onToneChange}
          onOptionChange={onOptionChange}
        />
      ))}
    </div>
  )
}
