// src/utils/formattingHelpers.ts

export function formatPokemonName(name: string, form?: string): string {
    if (!form) return name;
  
    const formattedForm = formatForm(form);
    const nameParts = name.split(' ');
    const specialModifiers = ['Shiny', 'Shadow'];
  
    let insertPosition = nameParts.findIndex(part => !specialModifiers.includes(part));
    if (insertPosition === -1 || nameParts.length === 1) {
      insertPosition = 0;
    }
  
    nameParts.splice(insertPosition, 0, formattedForm);
    return nameParts.join(' ');
  }
  
  export function formatForm(form: string): string {
    if (!form) return '';
  
    const words = form
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  
    return words.join(' ');
  }
  
  export function formatCostume(costume?: { name?: string }): string {
    if (!costume?.name) return '';
  
    const words = costume.name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  
    return words.join(' ');
  }
  
  export function formatShinyRarity(rarity: string): string {
    switch (rarity) {
      case 'community_day':
        return 'Community Day ~1/25';
      case 'research_day':
        return 'Research Day ~1/10';
      case 'raid_day':
        return 'Raid Day ~1/10';
      case 'mega_raid':
        return 'Mega Raid ~1/64';
      case 'permaboosted':
        return 'Permaboosted ~1/64';
      case 'baby_boost':
        return 'Egg ~1/64';
      case 'hatch_day':
        return 'Egg ~1/10';
      case 'legendary_raid':
        return 'Legendary Raid ~1/20';
      case 'ultra_beast_raid':
        return 'Ultra Beast Raid ~1/20';
      case 'mythical_raid':
        return 'Mythical Raid ~1/20';
      default:
        return 'Full Odds ~1/500';
    }
  }
  
  export function formatShinyShadowRarity(rarity: string): string {
    switch (rarity) {
      case 'shadow_encounter':
        return 'Rocket Boss ~1/64\nRocket Grunt or Shadow Raid ~1/256';
      case 'legendary_raid':
        return 'Shadow Raid ~1/20';
      default:
        return 'Unavailable';
    }
  }
  
  export function formatCostumeName(name: string): string {
    return name
      .split('_')
      .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
      .join(' ');
  }
  
  export function getLastWord(fullName: string): string | undefined {
    return fullName.split(' ').pop();
  }
  
  export function formatTimeAgo(timestamp: number): string {
    const milliseconds = Date.now() - timestamp;
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} old`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} old`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} old`;
    return `${seconds} second${seconds > 1 ? 's' : ''} old`;
  }
  
  export function formatTimeUntil(timestamp: number): string {
    const milliseconds = timestamp - Date.now();
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
  
  export function formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown Date';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
