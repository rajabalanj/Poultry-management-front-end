import React, { useState, useEffect } from 'react';
// import { apiService } from '../services/apiService';  // Use your actual apiService
import PageHeader from './PageHeader';
// import { Button } from '@/components/ui/button'; // Assuming you have shadcn/ui


const apiService = {
    getFeeds: async () => {
        await new Promise(resolve => setTimeout(resolve, 750));
        return [
            { id: 1, title: 'Maize', quantity: 50, unit: 'kg', lastUsedAt: null },
            { id: 2, title: 'Soybean Meal', quantity: 30, unit: 'kg', lastUsedAt: '2024-07-24T10:00:00Z' },
            { id: 3, title: 'Rice', quantity: 40, unit: 'kg', lastUsedAt: null },
        ];
    },
    updateFeedUsage: async (feedId: number) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Updating usage for feed ID: ${feedId}`);
        // Simulate a database update.  In a real application, this would come from the backend.
        return { id: feedId, lastUsedAt: new Date().toISOString() };
    },
};

interface Feed {
    id: number;
    title: string;
    quantity: number;
    unit: string;
    lastUsedAt: string | null;
}

interface FeedItemProps {
    feed: Feed;
    onFeedUsed: (updatedFeed: Feed) => void; // Callback to update the list
}

const FeedItem: React.FC<FeedItemProps> = ({ feed, onFeedUsed }) => {
    const handleUseFeed = async () => {
        try {
            const updatedFeed = await apiService.updateFeedUsage(feed.id); //  Use your apiService
            // toast.success(`Usage for feed "${feed.title}" updated!`); //  Remove toast
            //  The issue was here.  We need to merge the updated lastUsedAt with the existing feed data.
            const updatedFullFeed = { ...feed, lastUsedAt: updatedFeed.lastUsedAt };
            onFeedUsed(updatedFullFeed); // Update the parent component's state
        } catch (error: any) {
           // toast.error(error.message || 'Failed to update feed usage.');  //  Remove toast
            console.error("Error using feed", error);
        }
    };

    return (
        <div className="card mb-3">
            <div className="card-body">
                <h5 className="card-title">{feed.title}</h5>
                <p className="card-text">
                    <strong>Quantity:</strong> {feed.quantity} {feed.unit}
                </p>
                <p className="card-text">
                    <strong>Last Used:</strong> {feed.lastUsedAt ? new Date(feed.lastUsedAt).toLocaleString() : 'Not Used Yet'}
                </p>
                <button onClick={handleUseFeed} className="btn btn-primary mt-2">
                    Use Feed
                </button>
            </div>
        </div>
    );
};


const FeedItemList: React.FC = () => {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeeds = async () => {
            try {
                const data = await apiService.getFeeds(); //  Use your apiService
                setFeeds(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch feeds.');
            } finally {
                setLoading(false);
            }
        };
        fetchFeeds();
    }, []);

    const handleFeedUsed = (updatedFeed: any) => {
        setFeeds(feeds.map(f => f.id === updatedFeed.id ? { ...f, lastUsedAt: updatedFeed.lastUsedAt } : f));
    };

    if (loading) {
        return <div>Loading feeds...</div>; //  Basic loading indicator
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="container-fluid">
            <PageHeader
                title="Available Feeds"
                buttonLabel="Add New Feed"
                buttonLink="/add-feed"
            />
            <div>
                {feeds.length === 0 ? (
                    <div className="alert alert-info">No feeds available.</div>
                ) : (
                    feeds.map((feed) => (
                        <FeedItem key={feed.id} feed={feed} onFeedUsed={(updatedFeed) => handleFeedUsed(updatedFeed)} />
                    ))
                )}
            </div>
        </div>
    );
};

export  {FeedItem, FeedItemList};
