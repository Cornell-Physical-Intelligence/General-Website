// ============================================================================
// RECRUITING TOGGLE — the one line to change.
//
//   true  → ApplyOpen:   whatever forms the wiki has open (interest form,
//                        coffee chats, application); the crab when none is
//   false → ApplyClosed: the crab and "applications are closed", no wiki call
//
// Which forms are open, their titles, and their questions are edited in the
// wiki under Applications, not here. Details: README, "Apply page: what it
// shows", and AGENTS.md.
// ============================================================================
import ApplyOpen from './ApplyOpen';
import ApplyClosed from './ApplyClosed';

const APPLY_ACTIVE = true;

export default APPLY_ACTIVE ? ApplyOpen : ApplyClosed;
