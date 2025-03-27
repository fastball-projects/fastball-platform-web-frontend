import { Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { getCurrentBusinessContext, setCurrentBusinessContext } from 'fastball-frontend-common';
import { buildJsonRequestInfo } from './utils'

type BusinessContextItem = {
    id: string;
    title: string;
}

type BusinessContextSelectorProps = {
    businessContextKey: string
}

export const BusinessContextSelector: React.FC<BusinessContextSelectorProps> = ({
    businessContextKey
}) => {
    const [businessContextItems, setBusinessContextItems] = useState<BusinessContextItem[]>([]);
    const [businessContextId, setBusinessContextId] = useState<string | undefined>(getCurrentBusinessContext()?.businessContextId);

    const onChange = (value: string) => {
        setCurrentBusinessContext({
            businessContextKey,
            businessContextId: value,
        });
        setBusinessContextId(value)
        // location.reload();
    }

    const fetchData = async () => {
        try {
            const request = buildJsonRequestInfo()
            const response = await fetch(`/api/portal/web/business-context/${businessContextKey}`, request);
            const result = await response.json();
            const items: BusinessContextItem[] = result.data;
            if (!getCurrentBusinessContext()) {
                onChange(items[0].id);
            }
            setBusinessContextItems(items);
        } catch (error) {
            console.error('Error fetching business context data:', error);
        }
    };

    useEffect(() => {
        fetchData()
    }, []);

    const items = businessContextItems.map(item => ({ value: item.id, label: item.title }));

    return <Select
        showSearch
        variant="filled"
        style={{ width: 200 }}
        value={businessContextId}
        onChange={onChange}
        options={items}
    />
};