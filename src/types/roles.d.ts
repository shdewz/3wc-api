export const Role = {
  Administrator: 'administrator',
  Organiser: 'organiser',
  Player: 'player',
  Captain: 'captain',
  Staff: 'staff',
  Referee: 'referee',
  Streamer: 'streamer',
  Commentator: 'commentator',
  Designer: 'designer',
  Mappooler: 'mappooler',
  Mapper: 'mapper',
  Playtester: 'playtester',
} as const;

export type RoleName = (typeof Role)[keyof typeof Role];
