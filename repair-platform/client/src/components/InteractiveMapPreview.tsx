import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Flex, Spin, Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';

const { Text } = Typography;

type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
};

type GeocodeResponseItem = {
  lat: string;
  lon: string;
  display_name: string;
};

type MapPreviewCardProps = {
  title: string;
  query?: string;
  helperText?: string;
  emptyText?: string;
  height?: number;
};

const geocodeCache = new Map<string, GeocodeResult | null>();

function buildMapSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function SyncMapView({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
    const timer = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(timer);
  }, [center, map]);

  return null;
}

export default function InteractiveMapPreview({
  title,
  query,
  helperText,
  emptyText = '填写地址后即可看到地图预览。',
  height = 280
}: MapPreviewCardProps) {
  const trimmedQuery = query?.trim();
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trimmedQuery) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (geocodeCache.has(trimmedQuery)) {
      const cached = geocodeCache.get(trimmedQuery) ?? null;
      setResult(cached);
      setError(cached ? null : '暂时无法解析该位置，请尝试补充更完整的地址信息。');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(trimmedQuery)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('地图服务暂时不可用');
        }
        const data = (await response.json()) as GeocodeResponseItem[];
        const item = data[0];
        if (!item) {
          geocodeCache.set(trimmedQuery, null);
          setResult(null);
          setError('暂时无法解析该位置，请尝试补充更完整的地址信息。');
          return;
        }

        const nextResult = {
          lat: Number(item.lat),
          lng: Number(item.lon),
          label: item.display_name
        } satisfies GeocodeResult;
        geocodeCache.set(trimmedQuery, nextResult);
        setResult(nextResult);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }
        setResult(null);
        setError(fetchError instanceof Error ? fetchError.message : '地图解析失败');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [trimmedQuery]);

  const center = useMemo<[number, number] | null>(() => {
    if (!result) {
      return null;
    }
    return [result.lat, result.lng];
  }, [result]);

  return (
    <Card className="glass-card map-preview-card">
      <Flex vertical gap={10}>
        <div>
          <Text strong>{title}</Text>
          {helperText ? (
            <div>
              <Text type="secondary">{helperText}</Text>
            </div>
          ) : null}
        </div>

        {!trimmedQuery ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        ) : loading ? (
          <div className="map-frame-shell map-frame-loading" style={{ height }}>
            <Spin size="large" />
          </div>
        ) : error || !center ? (
          <>
            <Alert type="warning" showIcon message={error ?? '地图加载失败'} />
            <Button type="link" icon={<EnvironmentOutlined />} href={buildMapSearchUrl(trimmedQuery)} target="_blank" rel="noreferrer" style={{ paddingInline: 0 }}>
              在新窗口中查看地图
            </Button>
          </>
        ) : (
          <>
            <div className="map-frame-shell" style={{ height }}>
              <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom
                className="map-frame"
                zoomControl
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CircleMarker center={center} radius={11} pathOptions={{ color: '#ff7a00', fillColor: '#ff7a00', fillOpacity: 0.45 }}>
                  <Popup>{result?.label ?? trimmedQuery}</Popup>
                </CircleMarker>
                <SyncMapView center={center} />
              </MapContainer>
            </div>
            <Text type="secondary">鼠标悬停在地图区域时，可直接使用滚轮缩放；拖动地图也已启用。</Text>
            <Button type="link" icon={<EnvironmentOutlined />} href={buildMapSearchUrl(trimmedQuery)} target="_blank" rel="noreferrer" style={{ paddingInline: 0 }}>
              在新窗口中查看地图
            </Button>
          </>
        )}
      </Flex>
    </Card>
  );
}
