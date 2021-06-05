export interface AreArgsParsableByFlagsOptions {
  args: string[];
  flags: string[];
}

export function areArgsParsableByFlags({ args, flags }: AreArgsParsableByFlagsOptions): boolean {
  return flags.filter(Boolean).some(flag =>
    args.filter(Boolean).some(arg =>
      flag
        .split(',')
        .map(flag => flag.trim().split(' ')[0])
        .some(o => arg == o || arg.startsWith(`${o}=`))
    )
  );
}
