import { StandardHeader, type StandardHeaderProps } from "./header/StandardHeader";

export type { StandardHeaderProps as PageHeaderProps };

export function PageHeader(props: StandardHeaderProps) {
  return <StandardHeader {...props} />;
}
