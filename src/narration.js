// Narration: what the storyteller says at chapter starts and ends, in the house and at small moments; hint lines live with their levels.
export const INTRO = {
  b1: 'Ah, the fridge. Cold, quiet, and, as of this morning, home to one very determined little block of butter. Butter is not known for climbing. But then, nobody told the butter that.',
  b2: 'The pantry. Jars, sacks, a mousetrap, and absolutely nothing that wants to help a small pat of butter. Onwards.',
  b3: 'The living room. A piano, a great many cushions, and somewhere beyond them, the kitchen. Butter has never been this far from the fridge.',
  d1: 'Meanwhile, in the cutlery drawer, Fork and Knife have woken to find the butter dish empty. Well, they can hardly have breakfast without it.',
  d2: 'The dining room. A table the size of a small country, a tablecloth, and a serving spoon with ideas above its station.',
  d3: 'The study. Books, tape and a cork board. Somewhere out there is a block of butter, and Fork and Knife are getting closer.',
  t1: 'Together again at last. Fork, Knife and Butter, on the kitchen counter, before the house wakes up. Now then. Breakfast.',
  t2: 'After breakfast comes the washing up. A sink full of water, and only one of you can float. I wonder which.',
  t3: 'Night has fallen on the kitchen. It is cold, it is dark, and it is a very long way back to the drawer. Time to go home.',
};

export const OUTRO = 'And that is the end. Thank you for playing.';

export const HOUSE = {
  welcome: 'Welcome to the house. Everyone playing right now is in here somewhere. Each floor holds one story, and each room has a portal. Stand on one to begin.',
  back: ['Ah, you are back. The house has missed you. Mostly.', 'Welcome back. Pick a room, any room.', 'Back again. Splendid. Where to next?'],
  portal: 'That glowing arch is a portal. Stand on its plates with the right friends, and in you go.',
  locked: 'This one is still locked. Finish the room before it first.',
};

export const ROOMS = {
  b1: 'Cold Start. Where Butter\'s story begins, in the fridge.',
  b2: 'The Pantry. Jars, sacks, and one suspicious mousetrap.',
  b3: 'The Living Room. Do mind the piano.',
  d1: 'The Drawer. Where Fork and Knife\'s morning begins.',
  d2: 'The Dining Room. Bring a friend. And possibly a ladder.',
  d3: 'The Study. Quiet, please.',
  t1: 'Breakfast. All three of you, together.',
  t2: 'Washing Up. Butter floats. The others, sadly, do not.',
  t3: 'Goodnight. The last story of the day.',
};

export const EVENTS = {
  solve: ['Splendid.', 'Well, look at that.', 'Oh, very clever.', 'Nobody saw that coming. Least of all the butter.', 'Problem solved. Rather elegantly, too.', 'That will do nicely.', 'Marvellous.', 'And there it is.'],
  respawn: ['Oops. Shall we try that again?', 'Well, that did not go to plan.', 'Back you come.', 'Gravity, once again, undefeated.'],
  splash: ['A splash! How bracing.', 'Into the drink.', 'Water. Wet, as usual.'],
  melt: ['Butter has gone all runny.', 'And Butter melts. As butter does.', 'A puddle, but a determined one.'],
};
