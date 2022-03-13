import treeKill from 'tree-kill';
import { promisify } from 'util';

/**
 * T-kill means "try to tree-kill".
 */
export async function tKill(pid: number): Promise<void> {
  try {
    await promisify(treeKill)(pid);
  } catch {}
}
