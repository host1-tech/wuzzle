import { Button, Space, Spin, Typography } from 'antd';
import React, { FC, useCallback, useEffect, useState } from 'react';

const { Text } = Typography;

export const ProxiedHttpApi: FC = () => {
  let [isLoading, setLoading] = useState(false);
  const [data, setData] = useState<{ timestamp: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetch('/api/ping').then((res) => res.json()));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isSuccess = !isLoading && !!data;
  const isError = !isLoading && !data;

  return (
    <div>
      <h2>Fetching proxied http API</h2>
      <Space>
        <Text id="component-proxied-http-api-result">
          {isLoading && <Spin />}
          {isSuccess && `Server side timestamp is: ${data?.timestamp}`}
          {isError && <Text type="danger">Failed on invoking the ping API</Text>}
        </Text>
        <Button onClick={fetchData} loading={isLoading}>
          Refetch
        </Button>
      </Space>
    </div>
  );
};
