package com.sudokumind.backend.multiplayer.websocket;

import com.sudokumind.backend.common.util.CurrentUser;
import com.sudokumind.backend.multiplayer.dto.MultiplayerMoveRequest;
import com.sudokumind.backend.multiplayer.dto.ProgressRequest;
import com.sudokumind.backend.multiplayer.dto.RoomEvent;
import com.sudokumind.backend.multiplayer.service.MultiplayerService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
public class RoomWebSocketController {
    private final MultiplayerService multiplayerService;

    public RoomWebSocketController(MultiplayerService multiplayerService) {
        this.multiplayerService = multiplayerService;
    }

    @MessageMapping("/rooms/{roomId}/move")
    @SendTo("/topic/rooms/{roomId}/moves")
    public RoomEvent move(@DestinationVariable UUID roomId, MultiplayerMoveRequest request) {
        return multiplayerService.move(CurrentUser.id(), roomId, request);
    }

    @MessageMapping("/rooms/{roomId}/progress")
    @SendTo("/topic/rooms/{roomId}")
    public RoomEvent progress(@DestinationVariable UUID roomId, ProgressRequest request) {
        return multiplayerService.progress(CurrentUser.id(), roomId, request);
    }

    @MessageMapping("/rooms/{roomId}/presence")
    @SendTo("/topic/rooms/{roomId}/presence")
    public RoomEvent presence(@DestinationVariable UUID roomId) {
        return new RoomEvent("PRESENCE", CurrentUser.id(), "", -1, -1, 0, true, 0, 0);
    }
}
