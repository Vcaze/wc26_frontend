import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { getTeams, getUserPredictions, savePredictions } from "../api/api.js";
import "../style/predictions.css";

const GROUP_IDS = Array.from({ length: 12 }, (_, i) =>
    String.fromCharCode(65 + i)
);

function makeEmptySlots() {
    const obj = {};
    GROUP_IDS.forEach((g) => (obj[g] = [null, null, null, null]));
    return obj;
}

export default function Predictions() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [pools, setPools] = useState({});
    const [slots, setSlots] = useState(makeEmptySlots());
    const [finalMode, setFinalMode] = useState(false);
    const [error, setError] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("jwtToken");
        setToken(token);
        if (!token) {
            navigate("/login");
            return;
        }

        const email = localStorage.getItem("userEmail");
        setUserEmail(email);

        // fetch existing prediction
        getUserPredictions(token, email)
            .then((res) => {
                const existingDoc = Array.isArray(res) ? res[0] : res;
                const existingPreds = existingDoc && existingDoc.predictions;
                if (Array.isArray(existingPreds) && existingPreds.length > 0) {
                    // final mode
                    const loadedSlots = GROUP_IDS.reduce((acc, g) => {
                        const entry = existingPreds.find((p) => p.group === g);
                        acc[g] = entry && Array.isArray(entry.positions)
                            ? entry.positions
                            : [null, null, null, null];
                        return acc;
                    }, {});
                    setSlots(loadedSlots);
                    setFinalMode(true);
                } else {
                    // editable mode: show pool and empty slots
                    getTeams().then((teams) => {
                        const grouped = GROUP_IDS.reduce((acc, g) => {
                            acc[g] = teams.filter((t) => t.group === g) || [];
                            return acc;
                        }, {});
                        setPools(grouped);
                        setSlots(makeEmptySlots());
                    });
                }
            })
            .catch(() => setError("Failed to load prediction"))
            .finally(() => setLoading(false));
    }, [navigate]);

    const renderTeam = (team) => {
        if (!team) return null;
        return (
            <>
                <img className="team-flag" src={team.flagUrl} alt="flag" />
                <span className="team-name">{team.name}</span>
            </>
        );
    };

    const onDragEnd = (result) => {
        if (finalMode) return;

        const { source, destination } = result;
        if (!destination) return;

        const [sourceType, sourceGroup, sourceIdxStr] = source.droppableId.split(":");
        const [destType, destGroup, destIdxStr] = destination.droppableId.split(":");

        // No-op if same location
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const sourceIdx = parseInt(sourceIdxStr, 10);
        const destIdx = parseInt(destIdxStr, 10);

        const newPools = { ...pools };
        const newSlots = { ...slots };
        let draggedTeam = null;

        // take from source
        if (sourceType === "pool") {
            draggedTeam = (newPools[sourceGroup] || [])[source.index];
            if (draggedTeam === undefined) return;
            newPools[sourceGroup] = [...(newPools[sourceGroup] || [])];
            newPools[sourceGroup].splice(source.index, 1);
        } else if (sourceType === "slot") {
            draggedTeam = (newSlots[sourceGroup] || [])[sourceIdx] || null;
            if (!draggedTeam) return;
            newSlots[sourceGroup] = [...(newSlots[sourceGroup] || [])];
            newSlots[sourceGroup][sourceIdx] = null;
        }

        // place into destination
        if (destType === "pool") {
            newPools[destGroup] = [...(newPools[destGroup] || [])];
            newPools[destGroup].splice(destination.index, 0, draggedTeam);
        } else if (destType === "slot") {
            const destOccupied = (newSlots[destGroup] || [])[destIdx];
            newSlots[destGroup] = [...(newSlots[destGroup] || [])];
            if (destOccupied) {
                // swap behavior
                const displaced = destOccupied;
                newSlots[destGroup][destIdx] = draggedTeam;
                if (sourceType === "slot") {
                    newSlots[sourceGroup][sourceIdx] = displaced;
                } else if (sourceType === "pool") {
                    // put displaced team back into original pool position
                    newPools[sourceGroup].splice(source.index, 0, displaced);
                }
            } else {
                // simple move into empty slot
                newSlots[destGroup][destIdx] = draggedTeam;
            }
        }

        setPools(newPools);
        setSlots(newSlots);
    };

    const allSlotsFilled = () => {
        return GROUP_IDS.every((g) => (slots[g] || []).every((t) => t));
    };

    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const fillRandom = () => {
        if (finalMode) return;
        const nextPools = { ...pools };
        const nextSlots = { ...slots };

        GROUP_IDS.forEach((g) => {
            const currentSlots = (nextSlots[g] || []).filter(Boolean);
            const currentPool = nextPools[g] || [];
            const all = [...currentSlots, ...currentPool];
            if (all.length === 0) return;
            const shuffled = shuffleArray(all);
            nextSlots[g] = [
                shuffled[0] || null,
                shuffled[1] || null,
                shuffled[2] || null,
                shuffled[3] || null,
            ];
            nextPools[g] = [];
        });

        setPools(nextPools);
        setSlots(nextSlots);
    };

    const saveSlots = async (slotsState) => {
        if (!token || !userEmail) {
            setError("Missing authentication");
            return;
        }
        // Prevent saving unless all slots are filled
        if (!allSlotsFilled()) {
            return;
        }

        const predictionsPayload = GROUP_IDS.map((g) => ({
            group: g,
            positions: (slotsState[g] || []).map((t) => (t ? { name: t.name, group: t.group, flagUrl: t.flagUrl } : null)),
        }));

        try {
            const res = await savePredictions(token, userEmail, predictionsPayload);
            setFinalMode(true);
        } catch (e) {
            console.error(e);
            setError("Failed to save predictions");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="predictions-page">
            <h1 className="page-title">Predictions</h1>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="groups-container">
                    {GROUP_IDS.map((g) => (
                        <div key={g} className="group-box">
                            <h2 className="group-title">Group {g}</h2>

                            {/* Show source pool only while editing (no pool in final mode) */}
                            {!finalMode && (
                                <Droppable
                                    droppableId={`pool:${g}:0`}
                                    direction="vertical"
                                    isDropDisabled={finalMode}
                                >
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`team-pool ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                                        >
                                            {(pools[g] || []).map((team, idx) => (
                                                <Draggable
                                                    key={`${team.name}-${g}`}
                                                    draggableId={`${team.name}-${g}`}
                                                    index={idx}
                                                    isDragDisabled={finalMode}
                                                >
                                                    {(prov, snapshot) => (
                                                        <div
                                                            ref={prov.innerRef}
                                                            {...prov.draggableProps}
                                                            {...prov.dragHandleProps}
                                                            className={`team ${snapshot.isDragging ? "dragging" : ""}`}
                                                        >
                                                            {renderTeam(team)}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            )}

                            <div className="team-slots-container">
                                <div className="slots-title">
                                    {finalMode ? "Your saved prediction" : "Predicted order"}
                                </div>
                                {(slots[g] || []).map((slotVal, idx) => (
                                    <Droppable
                                        droppableId={`slot:${g}:${idx}`}
                                        isDropDisabled={finalMode}
                                    >
                                        {(provided, slotSnap) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`team-slot ${slotSnap.isDraggingOver ? "drag-over" : ""}`}
                                            >
                                                <div className="slot-number">{idx + 1}.</div>
                                                {slotVal ? (
                                                    // Hide the existing team while a new item is hovering over this slot
                                                    slotSnap.isDraggingOver && !finalMode ? (
                                                        <div className="team team-hidden">
                                                            {renderTeam(slotVal)}
                                                        </div>
                                                    ) : (
                                                        <Draggable
                                                            key={`${slotVal.name}-${g}-slot-${idx}`}
                                                            draggableId={`${slotVal.name}-${g}`}
                                                            index={0}
                                                            isDragDisabled={finalMode}
                                                        >
                                                            {(prov, dragSnap) => (
                                                                <div
                                                                    ref={prov.innerRef}
                                                                    {...prov.draggableProps}
                                                                    {...prov.dragHandleProps}
                                                                    className={`team ${dragSnap.isDragging ? "dragging" : ""}`}
                                                                >
                                                                    {renderTeam(slotVal)}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    )
                                                ) : (
                                                    <div className="empty-slot">(empty)</div>
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {!finalMode && (
                <div className="save-container">
                    <button
                        className="fill-button"
                        onClick={fillRandom}
                    >
                        Fill random predictions
                    </button>
                    <button
                        className="save-button"
                        disabled={!allSlotsFilled()}
                        onClick={() => {
                            if (allSlotsFilled()) {
                                saveSlots(slots);
                            }
                        }}
                    >
                        Save predictions
                    </button>
                </div>
            )}
        </div>
    );
}
