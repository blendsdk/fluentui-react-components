import actor01 from './assets/casting-actors/actor-01.jpg';
import actor02 from './assets/casting-actors/actor-02.jpg';
import actor03 from './assets/casting-actors/actor-03.jpg';
import actor04 from './assets/casting-actors/actor-04.jpg';
import actor05 from './assets/casting-actors/actor-05.jpg';
import actor06 from './assets/casting-actors/actor-06.jpg';
import actor07 from './assets/casting-actors/actor-07.jpg';
import actor08 from './assets/casting-actors/actor-08.jpg';
import actor09 from './assets/casting-actors/actor-09.jpg';
import actor10 from './assets/casting-actors/actor-10.jpg';
import actor11 from './assets/casting-actors/actor-11.jpg';
import actor12 from './assets/casting-actors/actor-12.jpg';
import actor13 from './assets/casting-actors/actor-13.jpg';
import actor14 from './assets/casting-actors/actor-14.jpg';
import actor15 from './assets/casting-actors/actor-15.jpg';
import actor16 from './assets/casting-actors/actor-16.jpg';
import actor17 from './assets/casting-actors/actor-17.jpg';
import actor18 from './assets/casting-actors/actor-18.jpg';
import actor19 from './assets/casting-actors/actor-19.jpg';
import actor20 from './assets/casting-actors/actor-20.jpg';
import actor21 from './assets/casting-actors/actor-21.jpg';
import actor22 from './assets/casting-actors/actor-22.jpg';
import actor23 from './assets/casting-actors/actor-23.jpg';
import actor24 from './assets/casting-actors/actor-24.jpg';
import actor25 from './assets/casting-actors/actor-25.jpg';
import actor26 from './assets/casting-actors/actor-26.jpg';
import actor27 from './assets/casting-actors/actor-27.jpg';
import actor28 from './assets/casting-actors/actor-28.jpg';

/** One synthetic actor portrait used by the actors reference story. */
export interface CastingActor {
  /** Stable identity used by the grid and the story dialogs. */
  id: string;
  /** Fictional display name shown below the portrait. */
  name: string;
  /** Imported portrait URL. */
  image: string;
}

/**
 * Fictional actors paired with the synthetic portraits in `assets/casting-actors`.
 *
 * The assets are demo fixtures, not real people or production casting data. Their
 * separate source and usage notice lives beside the images.
 */
export const castingActors: readonly CastingActor[] = [
  { id: 'actor-01', name: 'Alex de Vries', image: actor01 },
  { id: 'actor-02', name: 'Bram Jansen', image: actor02 },
  { id: 'actor-03', name: 'Cas van Dijk', image: actor03 },
  { id: 'actor-04', name: 'Daan Smit', image: actor04 },
  { id: 'actor-05', name: 'Eva Bakker', image: actor05 },
  { id: 'actor-06', name: 'Fenna Visser', image: actor06 },
  { id: 'actor-07', name: 'Gina Mulder', image: actor07 },
  { id: 'actor-08', name: 'Hanna Bos', image: actor08 },
  { id: 'actor-09', name: 'Iris de Boer', image: actor09 },
  { id: 'actor-10', name: 'Jens Kok', image: actor10 },
  { id: 'actor-11', name: 'Julia Meijer', image: actor11 },
  { id: 'actor-12', name: 'Kiki van Leeuwen', image: actor12 },
  { id: 'actor-13', name: 'Lars Peters', image: actor13 },
  { id: 'actor-14', name: 'Mila Jacobs', image: actor14 },
  { id: 'actor-15', name: 'Noud Willems', image: actor15 },
  { id: 'actor-16', name: 'Olivia Brouwer', image: actor16 },
  { id: 'actor-17', name: 'Puck van den Berg', image: actor17 },
  { id: 'actor-18', name: 'Quinten Dijkstra', image: actor18 },
  { id: 'actor-19', name: 'Ruben Smits', image: actor19 },
  { id: 'actor-20', name: 'Sem de Graaf', image: actor20 },
  { id: 'actor-21', name: 'Teun van der Wal', image: actor21 },
  { id: 'actor-22', name: 'Victor Hermans', image: actor22 },
  { id: 'actor-23', name: 'Wes van Dam', image: actor23 },
  { id: 'actor-24', name: 'Xavi de Haan', image: actor24 },
  { id: 'actor-25', name: 'Yannick Vos', image: actor25 },
  { id: 'actor-26', name: 'Zoe van der Meer', image: actor26 },
  { id: 'actor-27', name: 'Anna Koster', image: actor27 },
  { id: 'actor-28', name: 'Cato Vermeer', image: actor28 },
];

/** Reads the stable actor identity. */
export function getCastingActorId(actor: CastingActor): string {
  return actor.id;
}

/** Reads the visible and accessible actor name. */
export function getCastingActorName(actor: CastingActor): string {
  return actor.name;
}
