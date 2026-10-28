import { createContext, useContext, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { Icon } from '../icons';

/** A card in the chat's context: the id its chip carries, and the title the chip shows. */
export type ContextItem = { id: string; title: string };

type SelectModeValue = {
  active: boolean;
  page: string;
  selected: ContextItem[];
  toggle: (item: ContextItem) => void;
};

const SelectModeContext = createContext<SelectModeValue>({ active: false, page: '', selected: [], toggle: () => {} });

export type SelectModeProviderProps = {
  /** Whether select mode is on: every `SelectableCard` inside shows its tab and takes a click. */
  active: boolean;
  /** The cards in the chat's context, each with the id from `contextId`. A card in it keeps its outline, in select mode or out. */
  selected: ContextItem[];
  /** Called with a card when a click adds it to the context or takes it out; the app updates `selected`. */
  onToggle: (item: ContextItem) => void;
  /** The page the cards are on, so a card's id names its page and a chip outlines only its own card. Defaults to `''`. */
  page?: string;
  /** The page's cards, each one that can be added wrapped in `SelectableCard`. */
  children: ReactNode;
};

/**
 * Turns select mode on and off for the cards inside it, and holds which of them are in the chat's
 * context. It knows nothing about the chat: the app passes whether the mode is on, what's selected and
 * what to do on a toggle, and shows the selected cards as chips on its composer.
 *
 * @summary Holds select mode and the chat's selected cards for every SelectableCard inside it.
 * @import import { SelectModeProvider } from 'src/components/SelectableCard';
 */
export function SelectModeProvider({ active, selected, onToggle, page = '', children }: SelectModeProviderProps) {
  return <SelectModeContext.Provider value={{ active, page, selected, toggle: onToggle }}>{children}</SelectModeContext.Provider>;
}

/** Reads the nearest `SelectModeProvider`: whether select mode is on, the page, the selected cards and `toggle`. */
export const useSelectMode = () => useContext(SelectModeContext);

/** The id a card's chip carries: its page and its title, or the title alone when the provider has no page. */
export const contextId = (page: string, title: string) => (page ? `${page}#${title}` : title);

/**
 * Brings a card in the context into view, from its chip: it scrolls to the card's centre, smoothly unless
 * the person asks for reduced motion. Does nothing when the card isn't on the page.
 */
export function revealContext(id: string) {
  const card = document.querySelector(`[data-context-id="${CSS.escape(id)}"]`);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  card?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
}

export type SelectableCardProps = {
  /** The card's title: it names the click target (“Add {title} to the chat”) and, with the page, makes the card's id. */
  title: string;
  /** The card, usually an outlined MUI `Card`. */
  children: ReactNode;
};

/**
 * Wraps a card so it can be added to the chat as context. With select mode off, it renders the card as
 * it is, outlined in `secondary.main` while the card is in the context. With select mode on, a small
 * brand-blue tab with a plus sits on the card's top edge, and a transparent button over the whole card
 * takes the click and adds it to the context or takes it out; the tab shows a check while it's in.
 * The card's own controls sit under that button, so select mode is a mode: turn it off to use them.
 *
 * @summary Lets a card be added to the chat's context in select mode, with a tab and an outline.
 * @import import { SelectableCard } from 'src/components/SelectableCard';
 */
export function SelectableCard({ title, children }: SelectableCardProps) {
  const { active, page, selected, toggle } = useSelectMode();
  const id = contextId(page, title);
  const chosen = selected.some((item) => item.id === id);

  // Over the card, at its edge and its radius (`card-radius`, two theme radii), so the outline replaces the card's own border.
  const outline = {
    position: 'absolute',
    inset: 0,
    borderRadius: 2,
    border: 1,
    borderColor: chosen ? 'secondary.main' : 'transparent',
  } as const;

  return (
    // Always the same wrapper, so the card inside doesn't remount (and redraw a chart) when select mode turns on or off.
    <Box data-context-id={id} sx={{ position: 'relative', height: '100%' }}>
      {children}
      {active ? (
        <ButtonBase
          aria-label={chosen ? `Remove ${title} from the chat` : `Add ${title} to the chat`}
          aria-pressed={chosen}
          onClick={() => toggle({ id, title })}
          sx={{
            ...outline,
            transition: (theme) => theme.transitions.create(['border-color', 'background-color'], { duration: theme.transitions.duration.shortest }),
            '&:hover': { borderColor: 'secondary.main', bgcolor: 'action.hover' },
          }}
        >
          {/* A tab on the card's top edge, towards the right and clear of its 16px corner, square where it meets the
              card and rounded above, as if part of its outline: a plus to add the card, a check once it's in. It sits
              inside the button, so it takes the click too. */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              bottom: '100%',
              right: (theme) => theme.spacing(3),
              width: (theme) => theme.spacing(2.5),
              height: (theme) => theme.spacing(2.5),
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              // A quarter of the theme radius on the top corners, square below.
              borderRadius: 'calc(var(--mui-shape-borderRadius) / 4) calc(var(--mui-shape-borderRadius) / 4) 0 0',
              // The icon takes body1's size, so it sits inside the tab.
              typography: 'body1',
            }}
          >
            <Icon name={chosen ? 'check' : 'add'} fontSize="inherit" />
          </Box>
        </ButtonBase>
      ) : (
        // Out of select mode, a card in the context keeps its outline, and its own controls stay usable.
        chosen && <Box aria-hidden sx={{ ...outline, pointerEvents: 'none' }} />
      )}
    </Box>
  );
}
