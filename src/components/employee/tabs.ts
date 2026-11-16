import type { Role } from '@/lib/types';

/** Props every employee-page tab receives (/employees/[id]). */
export type TabProps = { employeeId: string; tz: string; role: Role; archived: boolean };
