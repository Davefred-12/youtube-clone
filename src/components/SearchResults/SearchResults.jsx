import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API_KEY, value_converter } from "../../data";
import moment from "moment";
import "./SearchResults.css";

const SearchResults = () => {
  const { searchQuery } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${searchQuery}&type=video&key=${API_KEY}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to fetch videos');
        }

        const videoIds = data.items.map(item => item.id.videoId).join(',');
        
        const statsResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${API_KEY}`);
        const statsData = await statsResponse.json();

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch video statistics');
        }

        const videosWithStats = data.items.map(video => {
          const videoStats = statsData.items.find(stat => stat.id === video.id.videoId);
          return {
            ...video,
            statistics: videoStats?.statistics
          };
        });

        setVideos(videosWithStats);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      fetchVideos();
    }
  }, [searchQuery]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (videos.length === 0) return <div className="no-results">No videos found</div>;

  return (
    <div className="search-container">
      <div className="search-list">
        {videos.map((video) => (
          <Link 
            to={`/video/0/${video.id.videoId}`} // Added default category ID '0'
            key={video.id.videoId} 
            className="search-item"
          >
            <div className="search-video">
              <img 
                src={video.snippet.thumbnails.medium.url} 
                alt={video.snippet.title} 
              />
            </div>
            <div className="video-info">
              <h4>{video.snippet.title}</h4>
              <div className="video-stats">
                {video.statistics && (
                  <span>{value_converter(video.statistics.viewCount)} views • </span>
                )}
                <span>{moment(video.snippet.publishedAt).fromNow()}</span>
              </div>
              <div className="channel-name">
                <span>{video.snippet.channelTitle}</span>
              </div>
              <div className="video-desc">
                {video.snippet.description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;