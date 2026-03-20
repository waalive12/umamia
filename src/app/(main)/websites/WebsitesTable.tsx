import { DataColumn, DataTable, type DataTableProps, Icon, Button, useToast } from '@umami/react-zen';
import type { ReactNode } from 'react';
import { LinkButton } from '@/components/common/LinkButton';
import { useMessages, useNavigation, useApi, useConfig } from '@/components/hooks';
import { SquarePen, Copy } from 'lucide-react';
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
      <DataColumn id="trackingCode" label={formatMessage(labels.trackingCode)} width="120px">
        {(row: any) => <CopyTrackingCodeButton websiteId={row.id} />}
      </DataColumn>
      <DataColumn id="visitors" label={formatMessage(labels.uniqueVisitors)} align="end" width="100px">
        {(row: any) => <WebsiteStats websiteId={row.id} type="visitors" />}
      </DataColumn>
      <DataColumn id="visits" label={formatMessage(labels.visits)} align="end" width="100px">
        {(row: any) => <WebsiteStats websiteId={row.id} type="visits" />}
      </DataColumn>
      <DataColumn id="views" label={formatMessage(labels.views)} align="end" width="100px">
        {(row: any) => <WebsiteStats websiteId={row.id} type="views" />}
      </DataColumn>
      <DataColumn id="bounceRate" label={formatMessage(labels.bounceRate)} align="end" width="80px">
        {(row: any) => <WebsiteStats websiteId={row.id} type="bounceRate" />}
      </DataColumn>
      <DataColumn id="visitDuration" label={formatMessage(labels.visitDuration)} align="end" width="120px">
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

const CopyTrackingCodeButton = ({ websiteId }: { websiteId: string }) => {
  const { formatMessage, labels } = useMessages();
  const config = useConfig();
  const { toast } = useToast();

  const handleCopy = () => {
    const trackerScriptName =
      config?.trackerScriptName?.split(',')?.map((n: string) => n.trim())?.[0] || 'script.js';

    const getUrl = () => {
      if (config?.cloudMode) {
        return `${process.env.cloudUrl}/${trackerScriptName}`;
      }

      return `${window?.location?.origin || ''}${process.env.basePath || ''}/${trackerScriptName}`;
    };

    const url = trackerScriptName?.startsWith('http') ? trackerScriptName : getUrl();
    const code = `<script defer src="${url}" data-website-id="${websiteId}"></script>`;

    navigator.clipboard.writeText(code);
    toast(formatMessage(labels.copied));
  };

  return (
    <Button variant="quiet" onPress={handleCopy} style={{ fontSize: '12px' }}>
      <Icon>
        <Copy />
      </Icon>
      {formatMessage(labels.copy)}
    </Button>
  );
};

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
