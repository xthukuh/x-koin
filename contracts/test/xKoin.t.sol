// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {xKoinToken} from "../src/xKoinToken.sol";
import {xKoinTreasury} from "../src/xKoinTreasury.sol";
import {xKoinEscrow} from "../src/xKoinEscrow.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract xKoinTestBase is Test {
    xKoinToken token;
    xKoinTreasury treasury;
    xKoinEscrow escrow;

    address owner = makeAddr("owner");
    address bridge = makeAddr("bridge");
    address nodeAdmin = makeAddr("nodeAdmin");
    address relayer = makeAddr("relayer");

    uint256 clientKey = 0xC11E47;
    address client;

    uint256 constant PRICE = 5; // 5 KES cents per MB
    uint16 constant FEE_BPS = 500; // 5%

    function setUp() public virtual {
        client = vm.addr(clientKey);
        token = new xKoinToken(owner);
        treasury = new xKoinTreasury(owner, FEE_BPS);
        escrow = new xKoinEscrow(IERC20(address(token)), treasury, PRICE, owner);

        vm.prank(owner);
        token.setBridge(bridge, true);
        // Simulate fiat on-ramp: 100.00 KES minted against an M-Pesa receipt.
        vm.prank(bridge);
        token.bridgeMint(client, 10_000, keccak256("ws_CO_051020260001"));
    }

    function _ticket(uint64 seq, uint128 cumUnits, uint256 expiry)
        internal
        view
        returns (xKoinEscrow.Ticket memory)
    {
        return xKoinEscrow.Ticket({
            client: client,
            nodeAdmin: nodeAdmin,
            sequenceNumber: seq,
            cumulativeUnits: cumUnits,
            epochExpiry: expiry
        });
    }

    function _sign(xKoinEscrow.Ticket memory t, uint256 key) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, escrow.hashTicket(t));
        return abi.encodePacked(r, s, v);
    }

    function _depositAll() internal {
        vm.startPrank(client);
        token.approve(address(escrow), 10_000);
        escrow.deposit(10_000);
        vm.stopPrank();
    }
}

contract TokenTest is xKoinTestBase {
    function test_metadata() public view {
        assertEq(token.name(), "xKoin");
        assertEq(token.symbol(), "XKN");
        assertEq(token.decimals(), 2);
    }

    function test_bridgeMintBurn() public {
        assertEq(token.balanceOf(client), 10_000);
        vm.prank(bridge);
        token.bridgeBurn(client, 4_000, keccak256("payout-ref"));
        assertEq(token.balanceOf(client), 6_000);
        assertEq(token.totalSupply(), 6_000);
    }

    function test_revert_nonBridgeMint() public {
        vm.expectRevert(xKoinToken.NotBridge.selector);
        token.bridgeMint(client, 1, bytes32(0));
    }

    function test_revert_nonOwnerSetBridge() public {
        vm.expectRevert();
        vm.prank(client);
        token.setBridge(client, true);
    }

    function test_permit() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
                ),
                client,
                address(escrow),
                10_000,
                token.nonces(client),
                deadline
            )
        );
        bytes32 digest =
            keccak256(abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(clientKey, digest);
        token.permit(client, address(escrow), 10_000, deadline, v, r, s);
        assertEq(token.allowance(client, address(escrow)), 10_000);
    }
}

contract TreasuryTest is xKoinTestBase {
    function test_feeOn() public view {
        assertEq(treasury.feeOn(10_000), 500); // 5%
        assertEq(treasury.feeOn(19), 0); // floors below 20
    }

    function test_setFeeBps() public {
        vm.prank(owner);
        treasury.setFeeBps(250);
        assertEq(treasury.feeBps(), 250);
    }

    function test_revert_feeAboveCeiling() public {
        vm.prank(owner);
        vm.expectRevert(xKoinTreasury.FeeTooHigh.selector);
        treasury.setFeeBps(1001);
        vm.expectRevert(xKoinTreasury.FeeTooHigh.selector);
        new xKoinTreasury(owner, 1001);
    }

    function test_withdraw() public {
        vm.prank(bridge);
        token.bridgeMint(address(treasury), 1_000, bytes32(0));
        vm.prank(owner);
        treasury.withdraw(IERC20(address(token)), owner, 600);
        assertEq(token.balanceOf(owner), 600);
        assertEq(token.balanceOf(address(treasury)), 400);
    }
}

contract EscrowTest is xKoinTestBase {
    function test_depositAndWithdraw() public {
        _depositAll();
        assertEq(escrow.deposits(client), 10_000);
        vm.prank(client);
        escrow.withdrawDeposit(2_500);
        assertEq(escrow.deposits(client), 7_500);
        assertEq(token.balanceOf(client), 2_500);
    }

    function test_depositWithPermit_gasless() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
                ),
                client,
                address(escrow),
                10_000,
                token.nonces(client),
                deadline
            )
        );
        bytes32 digest =
            keccak256(abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(clientKey, digest);

        // Relayer submits; client spends zero gas.
        vm.prank(relayer);
        escrow.depositWithPermit(client, 10_000, deadline, v, r, s);
        assertEq(escrow.deposits(client), 10_000);

        // Replaying the consumed permit must not brick a fresh approve path.
        vm.prank(client);
        token.approve(address(escrow), 0); // nothing left anyway
    }

    function test_settle_singleTicket() public {
        _depositAll();
        // 200 MB relayed => 200 * 5 = 1000 cents gross, 5% fee = 50.
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, 200, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);

        vm.prank(relayer);
        escrow.settleTicketBatch(ts, sigs);

        assertEq(escrow.deposits(client), 9_000);
        assertEq(escrow.earnings(nodeAdmin), 950);
        assertEq(token.balanceOf(address(treasury)), 50);

        (uint64 seq, uint128 units) = escrow.channelState(client, nodeAdmin);
        assertEq(seq, 1);
        assertEq(units, 200);
    }

    function test_settle_cumulativeDeltaAcrossBatches() public {
        _depositAll();
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        bytes[] memory sigs = new bytes[](1);

        ts[0] = _ticket(1, 200, block.timestamp + 1 days);
        sigs[0] = _sign(ts[0], clientKey);
        escrow.settleTicketBatch(ts, sigs);

        // Later ticket at cumulative 500: node is owed the 300 delta only.
        ts[0] = _ticket(7, 500, block.timestamp + 1 days);
        sigs[0] = _sign(ts[0], clientKey);
        escrow.settleTicketBatch(ts, sigs);

        assertEq(escrow.deposits(client), 10_000 - 500 * PRICE);
        assertEq(escrow.earnings(nodeAdmin), 2_375); // 2500 - 5%
        assertEq(token.balanceOf(address(treasury)), 125);
    }

    function test_settle_skippedIntermediateTicketLosesNothing() public {
        _depositAll();
        // Node lost tickets 1..9 offline; settles only seq 10 at cumulative 400.
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(10, 400, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);
        escrow.settleTicketBatch(ts, sigs);
        assertEq(escrow.earnings(nodeAdmin), 400 * PRICE * 95 / 100);
    }

    function test_settle_partialWhenDepositShort() public {
        // Client deposits only 3.00 KES but signs for 200 MB (10.00 KES owed).
        vm.startPrank(client);
        token.approve(address(escrow), 300);
        escrow.deposit(300);
        vm.stopPrank();

        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, 200, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);
        escrow.settleTicketBatch(ts, sigs);

        assertEq(escrow.deposits(client), 0);
        assertEq(escrow.earnings(nodeAdmin), 285); // 300 - 5%
        assertEq(token.balanceOf(address(treasury)), 15);
    }

    function test_solvencyInvariant() public {
        _depositAll();
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, 333, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);
        escrow.settleTicketBatch(ts, sigs);

        // Escrow token balance must exactly back deposits + earnings.
        assertEq(
            token.balanceOf(address(escrow)), escrow.deposits(client) + escrow.earnings(nodeAdmin)
        );
    }

    function test_claimEarnings() public {
        test_settle_singleTicket();
        vm.prank(nodeAdmin);
        escrow.claimEarnings(nodeAdmin, 950);
        assertEq(token.balanceOf(nodeAdmin), 950);
        assertEq(escrow.earnings(nodeAdmin), 0);
    }

    function test_revert_claimTooMuch() public {
        test_settle_singleTicket();
        vm.prank(nodeAdmin);
        vm.expectRevert(xKoinEscrow.InsufficientEarnings.selector);
        escrow.claimEarnings(nodeAdmin, 951);
    }

    function test_revert_staleSequence() public {
        test_settle_singleTicket();
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, 300, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);
        vm.expectRevert(abi.encodeWithSelector(xKoinEscrow.StaleSequence.selector, 0));
        escrow.settleTicketBatch(ts, sigs);
    }

    function test_revert_noNewUnits() public {
        test_settle_singleTicket();
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(2, 200, block.timestamp + 1 days); // same cumulative
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);
        vm.expectRevert(abi.encodeWithSelector(xKoinEscrow.NoNewUnits.selector, 0));
        escrow.settleTicketBatch(ts, sigs);
    }

    function test_revert_expiredTicket() public {
        _depositAll();
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, 100, block.timestamp - 1);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);
        vm.expectRevert(abi.encodeWithSelector(xKoinEscrow.ExpiredTicket.selector, 0));
        escrow.settleTicketBatch(ts, sigs);
    }

    function test_revert_forgedSignature() public {
        _depositAll();
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, 100, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], 0xBAD); // attacker key, not the client
        vm.expectRevert(abi.encodeWithSelector(xKoinEscrow.BadSignature.selector, 0));
        escrow.settleTicketBatch(ts, sigs);
    }

    function test_revert_lengthMismatchAndEmpty() public {
        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, 100, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](0);
        vm.expectRevert(xKoinEscrow.LengthMismatch.selector);
        escrow.settleTicketBatch(ts, sigs);

        vm.expectRevert(xKoinEscrow.EmptyBatch.selector);
        escrow.settleTicketBatch(new xKoinEscrow.Ticket[](0), sigs);
    }

    function test_setPricePerUnit() public {
        vm.prank(owner);
        escrow.setPricePerUnit(8);
        assertEq(escrow.pricePerUnit(), 8);
        vm.prank(owner);
        vm.expectRevert(xKoinEscrow.ZeroPrice.selector);
        escrow.setPricePerUnit(0);
    }

    function testFuzz_settleNeverExceedsDeposit(uint128 units, uint96 depositAmt) public {
        units = uint128(bound(units, 1, 1e12));
        depositAmt = uint96(bound(depositAmt, 1, 10_000));
        vm.startPrank(client);
        token.approve(address(escrow), depositAmt);
        escrow.deposit(depositAmt);
        vm.stopPrank();

        xKoinEscrow.Ticket[] memory ts = new xKoinEscrow.Ticket[](1);
        ts[0] = _ticket(1, units, block.timestamp + 1 days);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(ts[0], clientKey);
        escrow.settleTicketBatch(ts, sigs);

        assertLe(escrow.earnings(nodeAdmin) + token.balanceOf(address(treasury)), depositAmt);
        assertEq(
            token.balanceOf(address(escrow)), escrow.deposits(client) + escrow.earnings(nodeAdmin)
        );
    }
}
