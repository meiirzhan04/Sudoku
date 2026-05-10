package com.sudokumind.backend.multiplayer.service;

import com.sudokumind.backend.common.enums.Difficulty;
import com.sudokumind.backend.common.enums.RoomStatus;
import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.game.sudoku.SudokuEngine;
import com.sudokumind.backend.multiplayer.dto.*;
import com.sudokumind.backend.multiplayer.entity.MultiplayerMove;
import com.sudokumind.backend.multiplayer.entity.MultiplayerPlayer;
import com.sudokumind.backend.multiplayer.entity.MultiplayerRoom;
import com.sudokumind.backend.multiplayer.repository.MultiplayerMoveRepository;
import com.sudokumind.backend.multiplayer.repository.MultiplayerPlayerRepository;
import com.sudokumind.backend.multiplayer.repository.MultiplayerRoomRepository;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MultiplayerService {
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final MultiplayerRoomRepository roomRepository;
    private final MultiplayerPlayerRepository playerRepository;
    private final MultiplayerMoveRepository moveRepository;
    private final UserService userService;
    private final SudokuEngine sudokuEngine;
    private final SecureRandom random = new SecureRandom();

    public MultiplayerService(MultiplayerRoomRepository roomRepository, MultiplayerPlayerRepository playerRepository, MultiplayerMoveRepository moveRepository, UserService userService, SudokuEngine sudokuEngine) {
        this.roomRepository = roomRepository;
        this.playerRepository = playerRepository;
        this.moveRepository = moveRepository;
        this.userService = userService;
        this.sudokuEngine = sudokuEngine;
    }

    @Transactional
    public CreateRoomResponse createRoom(UUID userId) {
        User host = userService.require(userId);
        var puzzle = sudokuEngine.generate(Difficulty.MEDIUM);
        MultiplayerRoom room = new MultiplayerRoom();
        room.setRoomCode(uniqueCode());
        room.setHostUser(host);
        room.setPuzzle(puzzle.puzzle());
        room.setSolution(puzzle.solution());
        roomRepository.save(room);
        createPlayer(room, host);
        return new CreateRoomResponse(room.getId(), room.getRoomCode(), room.getStatus(), room.getPuzzle());
    }

    @Transactional
    public RoomResponse join(UUID userId, JoinRoomRequest request) {
        User guest = userService.require(userId);
        MultiplayerRoom room = roomRepository.findByRoomCodeIgnoreCase(request.roomCode())
                .orElseThrow(() -> new ApiException(ErrorCode.ROOM_NOT_FOUND));
        if (room.getGuestUser() != null && !room.getGuestUser().getId().equals(userId) && !room.getHostUser().getId().equals(userId)) {
            throw new ApiException(ErrorCode.ROOM_ALREADY_FULL);
        }
        if (!room.getHostUser().getId().equals(userId) && room.getGuestUser() == null) {
            room.setGuestUser(guest);
            roomRepository.save(room);
            createPlayer(room, guest);
        }
        return room(room.getId());
    }

    public RoomResponse room(UUID roomId) {
        MultiplayerRoom room = require(roomId);
        List<RoomPlayerResponse> players = playerRepository.findByRoomId(roomId).stream()
                .map(player -> new RoomPlayerResponse(
                        player.getUser().getId(),
                        player.getUser().getUsername(),
                        player.getUser().getAvatarUrl(),
                        player.getMistakes(),
                        player.getElapsedSeconds(),
                        player.getProgressPercent(),
                        player.isConnected(),
                        player.getFinishedAt()
                ))
                .toList();
        return new RoomResponse(room.getId(), room.getRoomCode(), room.getStatus(), room.getWinnerUser() == null ? null : room.getWinnerUser().getId(), room.getPuzzle(), players);
    }

    @Transactional
    public RoomResponse start(UUID userId, UUID roomId) {
        MultiplayerRoom room = require(roomId);
        assertHost(userId, room);
        room.setStatus(RoomStatus.ACTIVE);
        room.setStartedAt(Instant.now());
        return room(roomRepository.save(room).getId());
    }

    @Transactional
    public RoomResponse rematch(UUID userId, UUID roomId) {
        MultiplayerRoom old = require(roomId);
        if (!old.getHostUser().getId().equals(userId) && (old.getGuestUser() == null || !old.getGuestUser().getId().equals(userId))) {
            throw new ApiException(ErrorCode.ACCESS_DENIED);
        }
        return room(createRoom(userId).roomId());
    }

    @Transactional
    public RoomResponse leave(UUID userId, UUID roomId) {
        MultiplayerRoom room = require(roomId);
        playerRepository.findByRoomIdAndUserId(roomId, userId).ifPresent(player -> {
            player.setConnected(false);
            playerRepository.save(player);
        });
        return room(roomId);
    }

    @Transactional
    public RoomEvent move(UUID userId, UUID roomId, MultiplayerMoveRequest request) {
        MultiplayerRoom room = require(roomId);
        User user = userService.require(userId);
        MultiplayerPlayer player = playerRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.ROOM_NOT_FOUND));
        int[][] board = sudokuEngine.copy(player.getCurrentBoard());
        boolean correct = room.getSolution()[request.row()][request.col()] == request.value();
        board[request.row()][request.col()] = request.value();
        player.setCurrentBoard(board);
        if (!correct && request.value() != 0) player.setMistakes(player.getMistakes() + 1);
        player.setProgressPercent(sudokuEngine.progressPercent(board));
        if (sudokuEngine.matchesSolution(board, room.getSolution()) && room.getStatus() != RoomStatus.FINISHED) {
            player.setFinishedAt(Instant.now());
            room.setStatus(RoomStatus.FINISHED);
            room.setWinnerUser(user);
            room.setFinishedAt(Instant.now());
            roomRepository.save(room);
        }
        playerRepository.save(player);
        MultiplayerMove move = new MultiplayerMove();
        move.setRoom(room);
        move.setUser(user);
        move.setRowIndex(request.row());
        move.setColIndex(request.col());
        move.setValue(request.value());
        move.setCorrect(correct);
        moveRepository.save(move);
        return new RoomEvent(room.getStatus() == RoomStatus.FINISHED ? "WINNER" : "MOVE", user.getId(), user.getUsername(), request.row(), request.col(), request.value(), correct, player.getProgressPercent(), player.getMistakes());
    }

    @Transactional
    public RoomEvent progress(UUID userId, UUID roomId, ProgressRequest request) {
        MultiplayerPlayer player = playerRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.ROOM_NOT_FOUND));
        player.setCurrentBoard(request.currentBoard());
        player.setElapsedSeconds(request.elapsedSeconds());
        player.setMistakes(request.mistakes());
        player.setProgressPercent(sudokuEngine.progressPercent(request.currentBoard()));
        playerRepository.save(player);
        return new RoomEvent("PROGRESS", userId, player.getUser().getUsername(), -1, -1, 0, true, player.getProgressPercent(), player.getMistakes());
    }

    private MultiplayerRoom require(UUID roomId) {
        return roomRepository.findById(roomId).orElseThrow(() -> new ApiException(ErrorCode.ROOM_NOT_FOUND));
    }

    private void assertHost(UUID userId, MultiplayerRoom room) {
        if (!room.getHostUser().getId().equals(userId)) throw new ApiException(ErrorCode.ACCESS_DENIED);
    }

    private void createPlayer(MultiplayerRoom room, User user) {
        MultiplayerPlayer player = new MultiplayerPlayer();
        player.setRoom(room);
        player.setUser(user);
        player.setCurrentBoard(sudokuEngine.copy(room.getPuzzle()));
        playerRepository.save(player);
    }

    private String uniqueCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                builder.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            }
            code = builder.toString();
        } while (roomRepository.existsByRoomCode(code));
        return code;
    }
}
