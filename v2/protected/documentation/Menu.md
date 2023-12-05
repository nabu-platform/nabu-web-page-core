There are a lot of menu types but in general there are two recurring ones that can be used separately or even together:

- a menu on the side of your screen from top to bottom
- a menu on the top of your screen from left to right

They have different challenges when trying to scale responsively because they have a different primary layout direction.

The menu on the side can probably still show all your entries when collapsed, it should just do so in an abbreviated manner. It needs to be able to "expand" again and take up much (if not all) of the screen until the user selects something or he closes it again.

The menu on the top probably needs to hide the entries that are layed out horizontally and show them vertically when requested in a responsive situation. Again user selection or explicit closing should revert to the collapsed state.

# Expansion

When a menu is collapsed, sometimes you want to expand upon an explicit click of the user (on say a dedicated button). You may also want to expand on hover. The hover approach does not scale to mobile devices though.

On mobile a dedicated expansion button is needed. Because hover doesn't work at all, it shouldn't interfere with the hover effect.

I have looked at touchstart events and the like to figure something out but it is not consistent or intuitive to use.
A swipe motion could also be implemented.

## Explicit

In some cases you want the left side pane to be collapsible even if there is enough space to make even more space.
This is a user decision to collapse and this should be remembered if possible.

