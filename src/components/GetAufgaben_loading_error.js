import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const styles = {
    bg: "h-screen w-screen p-4 bg-gradient-to-b from-[#ffffff] to-[#d6d6d6]",
    container: "bg-slate-100 max-w-[500px] w-full m-auto rounded-md shadow-xl p-4",
};

export default function FetchCSVData() {
    const [csvData, setCsvData] = useState([]);
    const [userConfig, setUserConfig] = useState(null);
    const [isUserConfigLoading, setIsUserConfigLoading] = useState(true);
    const [isCSVLoading, setIsCSVLoading] = useState(true);
    const [loadingError, setLoadingError] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [uniqueTags, setUniqueTags] = useState([]);
    const [activeTag, setActiveTag] = useState("All");
    const [uniqueTypes, setUniqueTypes] = useState([]);
    const [activeType, setActiveType] = useState("All");
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const pow = (text) => {
        if (!text) return "";
        return text.replace(/([a-zA-Z0-9]+)\^(-?[a-zA-Z0-9]+)/g, (_, base, exponent) => `${base}<sup>${exponent}</sup>`);
    };

    const textwithbr = (text) => {
        if (!text) return "";
        return text.replace(/\/\//g, "<br />");
    };

    const parseCSVRow = (row) => {
        const result = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"' && row[i - 1] !== '\\') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }

        if (currentField) {
            result.push(currentField.trim());
        }

        return result;
    };

    const parseCSV = (csvText) => {
        if (!csvText) return [];

        const rows = csvText.split(/\r?\n/);
        if (rows.length === 0) return [];

        const headers = parseCSVRow(rows[0]);
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const rowData = parseCSVRow(rows[i]);
            if (!rowData || rowData.length === 0) continue;

            const rowObject = {};
            for (let j = 0; j < headers.length; j++) {
                rowObject[headers[j]?.trim()] = rowData[j]?.trim() || "";
            }
            data.push(rowObject);
        }
        return data;
    };

    const fetchCSVData = useCallback(async () => {
        try {
            if (!userConfig) return;

            const response = await axios.get(userConfig.url);
            const parsedCsvData = parseCSV(response.data);

            const publishedData = parsedCsvData.filter(item =>
                item.Publish?.toLowerCase().includes('ok')
            );

            setCsvData(publishedData);
            setFilteredData(publishedData);

            const tags = new Set();
            const types = new Set();

            publishedData.forEach(item => {
                if (item.Tags) {
                    item.Tags.split(',').forEach(tag => tags.add(tag.trim()));
                }
                if (item.Type) {
                    types.add(item.Type.trim());
                }
            });

            setUniqueTags(["All", ...Array.from(tags).sort()]);
            setUniqueTypes(["All", ...Array.from(types).sort()]);
        } catch (error) {
            setLoadingError('Failed to load CSV data.');
            console.error(error);
        } finally {
            setIsCSVLoading(false);
        }
    }, [userConfig]);

    const fetchConfig = async () => {
        try {
            const response = await fetch(
                'https://xsmobi.github.io/mathe-bbr-msa-config/config.json'
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching configuration JSON:', error);
            throw error;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const config = await fetchConfig();
                const user = searchParams.get('user');
                const selectedConfig = user ? config.users[user] : config.default;

                if (!selectedConfig) {
                    throw new Error('User configuration not found.');
                }

                setUserConfig(selectedConfig);
                setLoadingError(null); // Clear error state
                await fetchCSVData();
            } catch (error) {
                setLoadingError('Failed to load data.');
                console.error(error);
            } finally {
                setIsUserConfigLoading(false);
            }
        };

        loadData();
    }, [searchParams, fetchCSVData]);

    useEffect(() => {
        const taskId = searchParams.get('task');
        if (taskId) {
            const taskItem = csvData.find(item => item.id === taskId);
            setSelectedItem(taskItem || null);
        } else {
            setSelectedItem(null);
        }
    }, [searchParams, csvData]);

    const handleFilter = (tag) => {
        setActiveTag(tag);
        let filtered = csvData;

        if (tag !== "All") {
            filtered = filtered.filter(item =>
                item.Tags?.split(',').map(tag => tag.trim()).includes(tag)
            );
        }
        if (activeType !== "All") {
            filtered = filtered.filter(item => item.Type?.trim() === activeType);
        }
        setFilteredData(filtered);
    };

    const handleTypeFilter = (type) => {
        setActiveType(type);
        let filtered = csvData;

        if (activeTag !== "All") {
            filtered = filtered.filter(item =>
                item.Tags?.split(',').map(tag => tag.trim()).includes(activeTag)
            );
        }
        if (type !== "All") {
            filtered = filtered.filter(item => item.Type?.trim() === type);
        }
        setFilteredData(filtered);
    };

    const handleRowClick = (item) => {
        const user = searchParams.get('user');
        const newParams = user ? { user, task: item.id } : { task: item.id };
        setSearchParams(newParams);
        setSelectedItem(item);
    };

    const handleCloseProfile = () => {
        const user = searchParams.get('user');
        const newParams = user ? { user } : {};
        setSearchParams(newParams);
        setSelectedItem(null);
    };

    const handleTitleClick = () => {
        const shuffledData = [...filteredData].sort(() => Math.random() - 0.5);
        setFilteredData(shuffledData);
    };

    if (isUserConfigLoading || isCSVLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (loadingError) {
        return (
            <div className="error-screen">
                <p>{loadingError}</p>
            </div>
        );
    }

    return (
        <div className={userConfig?.background || 'default-bg'}>

        <div className={styles.bg}>
        <div className={styles.container}>


        <div className="overflow-x-auto">
            
            {/* Header */}
            {userConfig && (
                <header className="relative flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-blue-500" style={{ color: userConfig.titlecolor || 'blue' }}>
                        {userConfig.title}
                    </h1>
                    {userConfig.logo && (
                        <img
                            className="h-12 w-12 rounded-md"
                            src={userConfig.logo}
                            alt={`${userConfig.company} Logo`}
                        />
                    )}
                </header>
            )}
            {/* Subheader */}
            {userConfig?.tagline && (
                <h2 className="text-xl text-gray-700 mb-4">
                    {userConfig.tagline}
                </h2>
            )}

            {!selectedItem ? (
                <>
                    {/* Types Section */}
                    <div className="mb-4">
                        {/*<h3 className="text-xl font-bold mb-2">Types</h3>*/}
                        <div className="flex flex-wrap gap-2">
                            {uniqueTypes.map((type, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleTypeFilter(type)}
                                    className={`${
                                        activeType === type
                                            ? "bg-zinc-700 text-white"
                                            : "bg-zinc-500 hover:bg-green-700 text-white"
                                    } font-bold py-1 px-2 rounded-full text-xs`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="mb-4">
                        {/*<h3 className="text-xl font-bold mb-2">Tags</h3>*/}
                        <div className="flex flex-wrap gap-2">
                            {uniqueTags.map((tag, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleFilter(tag)}
                                    className={`${
                                        activeTag === tag
                                            //? "bg-blue-700 text-white"
                                            //: "bg-blue-500 hover:bg-blue-700 text-white"
                                            ? "bg-zinc-700 text-white"
                                            : "bg-zinc-500 hover:bg-green-700 text-white"
                                    } font-bold py-1 px-2 rounded-full text-xs`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Section */}
                    <table className="min-w-full table-auto border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-zinc-500 text-white">
                                <th
                                    className="border border-gray-300 px-4 py-2 text-left cursor-pointer"
                                    onClick={handleTitleClick}
                                >
                                    {userConfig?.taskheader || "Task List"} <small>(click to shuffle)</small>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} cursor-pointer`}
                                    onClick={() => handleRowClick(item)}
                                >
                                    <td className="border border-gray-300 px-4 py-2" dangerouslySetInnerHTML={{ __html: pow(item.Title) }}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : (
                // Profile Section
                <div className="relative p-4 bg-gray-100 border border-gray-300 rounded-md">
                    <button
                        onClick={handleCloseProfile}
                        className="absolute top-2 right-2 text-gray-500 text-xl hover:text-gray-700 text-xl font-bold"
                    >
                        ×
                    </button>
                    <h2
                        className="text-2xl mb-4"
                        dangerouslySetInnerHTML={{ __html: pow(selectedItem.Title) }}
                    />
                    <h4 
                        className="text-xl text-slate-500 mb-4"
                        dangerouslySetInnerHTML={{ __html: pow(selectedItem.Description) }}
                    />
                    {/* Render Images, Videos, Audio */}
                    {Array.from({ length: 10 }).map((_, index) => {
                        const titleKey = `Title${index + 1}`;
                        const imageKey = `Image${index + 1}`;
                        const captionKey = `Caption${index + 1}`;
                        const videoKey = `Video${index + 1}`;
                        const audioKey = `Audio${index + 1}`;
                        //console.log("Processed Caption:", pow(selectedItem[captionKey]));
                        return (
                            <div key={index} className="mb-4">
                                {selectedItem[titleKey] && (
                                    <div className="mb-4 mt-12">
                                        <h4
                                            className="text-center leading-8 text-lg font-semibold text-gray-900 bg-slate-300"
                                            dangerouslySetInnerHTML={{ __html: textwithbr(pow(selectedItem[titleKey])) }}
                                        />
                                    </div>
                                )}
                                {selectedItem[imageKey] && (
                                    <div className="mb-4">
                                        <img
                                            src={selectedItem[imageKey]}
                                            alt={selectedItem[captionKey] || `Image ${index + 1}`}
                                            className="w-full h-auto mb-2 rounded"
                                        />
                                        {selectedItem[captionKey] && (
                                        <p
                                            className="text-base text-gray-900"
                                            dangerouslySetInnerHTML={{ __html: textwithbr(pow(selectedItem[captionKey])) }}
                                        />
                                        )}  
                                    </div>
                                )}
                                {!selectedItem[imageKey] && selectedItem[captionKey] && (
                                    <div className="mb-4">
                                    {selectedItem[captionKey].includes("++") ? (
                                        <ul className="text-left list-none">
                                            {selectedItem[captionKey]
                                                .replace(/\+\+/g, "") // Remove "++" from the text
                                                .split("//")
                                                .map((line, idx) => (
                                                    <li key={idx} dangerouslySetInnerHTML={{ __html: textwithbr(pow(line)) }}></li>
                                                ))}
                                        </ul>
                                    ) : selectedItem[captionKey].includes("**") ? (
                                        <ul className="text-left list-square">
                                            {selectedItem[captionKey]
                                                .replace(/\*\*/g, "") // Remove "**" from the text
                                                .split("//")
                                                .map((line, idx) => (
                                                    <li key={idx} dangerouslySetInnerHTML={{ __html: textwithbr(pow(line)) }}></li>
                                                ))}
                                        </ul>
                                    ) : (
                                        <p
                                            className="text-center leading-8 text-lg font-semibold text-gray-900"
                                            dangerouslySetInnerHTML={{ __html: textwithbr(pow(selectedItem[captionKey])) }}
                                        ></p>
                                    )}
                                    </div>

                                )}
                                {selectedItem[videoKey] && (
                                    <div className="mb-4">
                                        <video controls className="w-full rounded-md">
                                            <source src={selectedItem[videoKey]} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                )}
                                {selectedItem[audioKey] && (
                                    <div className="mb-4">
                                        <audio controls className="w-full">
                                            <source src={selectedItem[audioKey]} type="audio/mpeg" />
                                            Your browser does not support the audio tag.
                                        </audio>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Render Links */}
                    {Array.from({ length: 3 }).map((_, index) => {
                        const linkKey = `Link${index + 1}`;
                        const urlKey = `url${index + 1}`;

                        if (selectedItem[linkKey] && selectedItem[urlKey]) {
                            return (
                                <div key={index} className="mb-4">
                                    <a
                                        href={selectedItem[urlKey]}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        className="block px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-colors"
                                    >
                                        {selectedItem[linkKey]}
                                    </a>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            )}
                {/* Footer */}
                {userConfig && (
                <footer className="mt-4 text-center text-sm text-gray-600">
                    <p>{userConfig.company}</p>
                </footer>
            )}
        </div>


        </div>
        </div>

        </div>  
    );
}