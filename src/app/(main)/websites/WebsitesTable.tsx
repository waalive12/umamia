import { DataColumn, DataTable, type DataTableProps, Icon } from '@umami/react-zen';
import type { ReactNode } from 'react';
import { LinkButton } from '@/components/common/LinkButton';
import { useMessages, useNavigation, useApi } from '@/components/hooks';
import { SquarePen } from '@/components/icons';
import { formatLongNumber, formatShortTime } from '@/lib/format';

export interface WebsitesTableProps extends DataTableProps {
  showActions?: boolean;
  allowEdit?: boolean;
  allowView?: boolean;
  renderLink?: (row: any) => ReactNode;
}

export function WebsitesTable({ showActions, renderLink, ...props }: WebsitesTableProps) {
  const { formatMessage, labels } = useMessages();
  const { renderUrl } = useNavigation();

  return (
    <DataTable {...props}>
      <DataColumn id="name" label={formatMessage(labels.name)}>
        {renderLink}
      </DataColumn>
      <DataColumn id="domain" label={formatMessage(labels.domain)} />
      <DataColumn id="visitors" label={formatMessage(labels.uniqueVisitors)}>
        {(row: any) => <WebsiteStats websiteId={row.id} type="visitors" />}
      </DataColumn>
      <DataColumn id="visits" label={formatMessage(labels.visits)}>
        {(row: any) => <WebsiteStats websiteId={row.id} type="visits" />}
      </DataColumn>
      <DataColumn id="views" label={formatMessage(labels.views)}>
        {(row: any) => <WebsiteStats websiteId={row.id} type="views" />}
      </DataColumn>
      <DataColumn id="bounceRate" label={formatMessage(labels.bounceRate)}>
        {(row: any) => <WebsiteStats websiteId={row.id} type="bounceRate" />}
      </DataColumn>
      <DataColumn id="visitDuration" label={formatMessage(labels.visitDuration)}>
        {(row: any) => <WebsiteStats websiteId={row.id} type="visitDuration" />}
      </DataColumn>
      {showActions && (
        <DataColumn id="action" label=" " align="end">
          {(row: any) => {
            const websiteId = row.id;

            return (
              <LinkButton href={renderUrl(`/websites/${websiteId}/settings`)} variant="quiet">
                <Icon>
                  <SquarePen />
                </Icon>
              </LinkButton>
            );
          }}
        </DataColumn>
      )}
    </DataTable>
  );
}

const WebsiteStats = ({ websiteId, type }: { websiteId: string; type: string }) => {
  const { get, useQuery } = useApi();
  const { data } = useQuery({
    queryKey: ['websites:stats:all', websiteId],
    queryFn: () =>
      get(`/websites/${websiteId}/stats`, {
        startAt: 0,// 强制从最早记录开始
        endAt: Date.now(),// 截止到当前时间
      }),
  });
  const { visitors, visits, pageviews, bounces, totaltime } = data || {};

  if (type === 'visitors') {
    return visitors?.toLocaleString() || 0;
  }

  if (type === 'visits') {
    return visits?.toLocaleString() || 0;
  }

  if (type === 'views') {
    return pageviews?.toLocaleString() || 0;
  }

  if (type === 'bounceRate') {
    const rate = visits ? (Math.min(visits, bounces) / visits) * 100 : 0;
    return `${Math.round(rate)}%`;
  }

  if (type === 'visitDuration') {
    const duration = visits ? totaltime / visits : 0;
    return formatShortTime(duration, ['m', 's'], ' ');
  }

  return null;
};
