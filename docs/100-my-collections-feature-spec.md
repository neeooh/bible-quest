# My Collections Feature Specification

## Overview

Add user-created collections to **My Verses**, allowing users to organise saved Bible passages into custom lists.

Keep this separate from the 12 curated topics under **Explore by Topic** on the Library page.

- **Explore by Topic:** Curated by the app to help users discover Scripture.
- **My Collections:** Created and managed by users to organise their saved passages.

## 1. My Verses Navigation

Add two tabs near the top of the existing My Verses page:

- **All Passages**
- **My Collections**

### All Passages

Preserve the existing interface and behaviour:

- Existing search bar filters saved passages.
- Existing filter pills remain: All, Favourites, Due for Review, Least Practised, Lowest Score, 100% Score, Learning Stage.
- Existing passage cards and actions remain available.

### My Collections

When selected, show a collection overview containing:

- A **Create Collection** button.
- A search field to filter collections.
- A list or grid of collection cards.

Each collection card shows its name and passage count. Last-updated information is optional. Clicking a card opens that collection.

## 2. Collection Management

Users can create, rename, open and delete collections.

- Collection name is required.
- Description is optional.
- Do not implement nested collections, folders, cover images or elaborate customisation in this MVP.
- Deleting a collection must not delete its passages from My Verses.

## 3. Collection Detail Page

When a user opens a collection, display:

- Back navigation to My Collections.
- Collection name and passage count.
- **Edit Collection** action.
- **Add Passages** action.
- Search field to filter passages within the collection.
- Existing passage cards for the collection's passages.

Allow users to reorder passages if straightforward to implement.

## 4. Adding Passages to Collections

Keep the existing passage-card actions:

- Practise
- Read
- Favourite
- Delete

Add an **Add to Collection** action.

When selected, show a popover or compact dialog containing:

- A multi-select list of the user's existing collections.
- A **Create Collection** option.
- A **Save** button.

A passage may belong to multiple collections.

Also provide **Add Passages** on the collection detail page, allowing users to select existing passages from My Verses and add them to the collection.

Do not create duplicate saved passages when adding them to collections.

## 5. Removing and Deleting Passages

Distinguish between:

- **Remove from Collection:** Removes the passage only from the currently open collection. It remains in My Verses and any other collections.
- **Delete from My Verses:** Permanently removes the saved passage from My Verses and every collection containing it.

Keep the existing Delete action on passage cards in All Passages.

Inside a collection, provide a contextual action such as a three-dot menu with **Remove from Collection**. Do not reuse the global Delete action for this purpose.

If a passage is deleted from My Verses, automatically remove its references from all collections.

## 6. Data and Behaviour Requirements

- Collections reference existing saved passages; they do not contain independent copies.
- A passage may belong to zero, one or multiple collections.
- Removing a passage from one collection must not affect its membership in other collections.
- Deleting a collection must not affect its passages.
- Deleting a saved passage must remove it from all collections.
- Collection membership and ordering should persist across reloads and app sessions.
- Provide clear empty states for: no collections created, an empty collection, and searches with no matches.

## 7. UI and Design Constraints

- Preserve the existing dark navy and gold visual design.
- Reuse existing components, passage cards, typography, spacing and interaction patterns wherever possible.
- Keep the current All Passages experience intact.
- Make the collection interface responsive, especially the collection picker and passage actions on mobile.
- Avoid duplicating Bible reader or memorisation functionality.

## Scope Summary

Implement:

1. All Passages / My Collections tabs.
2. Collection overview with search and collection cards.
3. Create, rename and delete collections.
4. Collection detail view with passage list and search.
5. Add existing passages to one or multiple collections.
6. Remove passages from a collection without deleting them globally.
7. Automatically remove deleted passages from all collections.
8. Persistent collection membership.

Do not modify the existing curated topics feature or Bible navigation.
