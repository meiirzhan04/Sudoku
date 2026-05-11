package com.sudokumind.backend.friends.service;

import com.sudokumind.backend.common.enums.FriendRequestStatus;
import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.friends.dto.*;
import com.sudokumind.backend.friends.entity.Friend;
import com.sudokumind.backend.friends.entity.FriendRequest;
import com.sudokumind.backend.friends.repository.FriendRepository;
import com.sudokumind.backend.friends.repository.FriendRequestRepository;
import com.sudokumind.backend.user.dto.PublicUserResponse;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import com.sudokumind.backend.user.service.UserMapper;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class FriendService {
    private final FriendRequestRepository requestRepository;
    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UserMapper userMapper;

    public FriendService(FriendRequestRepository requestRepository, FriendRepository friendRepository, UserRepository userRepository, UserService userService, UserMapper userMapper) {
        this.requestRepository = requestRepository;
        this.friendRepository = friendRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @Transactional
    public FriendRequestResponse send(UUID senderId, FriendRequestCreateRequest request) {
        User sender = userService.require(senderId);
        User receiver = userRepository.findByUsernameIgnoreCase(request.receiverUsername())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        if (sender.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("Cannot add yourself");
        }
        if (friendRepository.existsByUserIdAndFriendId(sender.getId(), receiver.getId())
                || requestRepository.existsBySenderIdAndReceiverIdAndStatus(sender.getId(), receiver.getId(), FriendRequestStatus.PENDING)
                || requestRepository.existsBySenderIdAndReceiverIdAndStatus(receiver.getId(), sender.getId(), FriendRequestStatus.PENDING)) {
            throw new ApiException(ErrorCode.FRIEND_REQUEST_ALREADY_EXISTS);
        }
        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setSender(sender);
        friendRequest.setReceiver(receiver);
        return toResponse(requestRepository.save(friendRequest));
    }

    public List<FriendRequestResponse> incoming(UUID userId) {
        return requestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, FriendRequestStatus.PENDING).stream().map(this::toResponse).toList();
    }

    public List<FriendRequestResponse> outgoing(UUID userId) {
        return requestRepository.findBySenderIdAndStatusOrderByCreatedAtDesc(userId, FriendRequestStatus.PENDING).stream().map(this::toResponse).toList();
    }

    @Transactional
    public FriendRequestResponse accept(UUID userId, UUID requestId) {
        FriendRequest request = requestRepository.findByIdAndReceiverId(requestId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        request.setStatus(FriendRequestStatus.ACCEPTED);
        createFriend(request.getSender(), request.getReceiver());
        createFriend(request.getReceiver(), request.getSender());
        return toResponse(requestRepository.save(request));
    }

    @Transactional
    public FriendRequestResponse decline(UUID userId, UUID requestId) {
        FriendRequest request = requestRepository.findByIdAndReceiverId(requestId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        request.setStatus(FriendRequestStatus.DECLINED);
        return toResponse(requestRepository.save(request));
    }

    public List<FriendResponse> friends(UUID userId) {
        Instant onlineSince = Instant.now().minusSeconds(300);
        return friendRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(friend -> new FriendResponse(
                        publicUser(friend.getFriend()),
                        friend.getFriend().getLastSeenAt() != null && friend.getFriend().getLastSeenAt().isAfter(onlineSince),
                        friend.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public void remove(UUID userId, UUID friendId) {
        friendRepository.deleteByUserIdAndFriendId(userId, friendId);
        friendRepository.deleteByUserIdAndFriendId(friendId, userId);
    }

    public List<PublicUserResponse> search(String username) {
        return userService.search(username);
    }

    private void createFriend(User user, User friendUser) {
        if (!friendRepository.existsByUserIdAndFriendId(user.getId(), friendUser.getId())) {
            Friend friend = new Friend();
            friend.setUser(user);
            friend.setFriend(friendUser);
            friendRepository.save(friend);
        }
    }

    private FriendRequestResponse toResponse(FriendRequest request) {
        return new FriendRequestResponse(
                request.getId(),
                publicUser(request.getSender()),
                publicUser(request.getReceiver()),
                request.getStatus(),
                request.getCreatedAt()
        );
    }

    private PublicUserResponse publicUser(User user) {
        return userMapper.toPublic(user, userService.stats(user.getId()));
    }
}
