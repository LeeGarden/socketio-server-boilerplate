'use strict'

const RoomHandler = require('./roomHandler')
const events = require('../constants/events')
const hashidsHelper = require('../helpers/hashids')
let parser = require('socket.io-parser');
let hasBin = require('has-binary2');

module.exports = class BaseHandler {
    constructor (socket, io) {
        this.socket = socket
        this.io = io
        this.handlers = []

        this.setHandlers()
        this.message()

        // Handle Override OnEvent, EmitEvent
        /*
        this.encodeData()
        this.decodeData()
        this.handleDataEmitAll()
        */

        console.log('usingHashId', this.socket.usingHashId)
    }

    message () {
        let self = this
        this.socket.on(events.REQUEST_ROOM, (data) => {
            self.roomHandler.requestRoom(data)
        })
    }

    setHandlers () {
        this.roomHandler = new RoomHandler(this.socket, this.io)
    }

    encodeData () {
        this.socket.onevent = function(packet){
            var args = packet.data || [];
            console.log('emitting event %j', args);

            if (null != packet.id) {
                // debug('attaching ack callback to event');
                args.push(this.ack(packet.id));
            }

            // Encode Data by Hashids
            if (args[1] !== undefined && args[1] !== null) {
                args[1] = hashidsHelper.encode(args[1])
            }
            console.log('emitting event %j', args[1]);
            this.dispatch(args);
        }
    }

    decodeData () {
        let emit = this.socket.emit
        this.socket.emit = function (ev) {
            if (events.DEFAULT_SOCKETIO_EVENTS.indexOf(ev) >= 0) {
                emit.apply(this, arguments);
                return this;
            }

            const args = Array.prototype.slice.call(arguments);
            const packet = {
                type: (this.flags.binary !== undefined ? this.flags.binary : hasBin(args)) ? parser.BINARY_EVENT : parser.EVENT,
                data: args
            };

            // Decode Data by Hashids
            let argsDecoded = [].concat(args)

            if (argsDecoded[1] !== undefined && argsDecoded[1] !== null) {
                if (typeof(argsDecoded[1]) === 'string') {
                    argsDecoded[1] = ( typeof (hashidsHelper.decodeId(argsDecoded[1])) === 'number' ) ? hashidsHelper.decodeId(argsDecoded[1]) : argsDecoded[1]
                } else {
                    argsDecoded[1] = hashidsHelper.decode(argsDecoded[1])
                }
            }

            const packetDecoded = {
                type: (this.flags.binary !== undefined ? this.flags.binary : hasBin(argsDecoded)) ? parser.BINARY_EVENT : parser.EVENT,
                data: argsDecoded
            };

            // access last argument to see if it's an ACK callback
            if (typeof args[args.length - 1] === 'function') {
                if (this._rooms.length || this.flags.broadcast) {
                    throw new Error('Callbacks are not supported when broadcasting');
                }

                this.acks[this.nsp.ids] = args.pop();
                packet.id = this.nsp.ids++;
            }

            const rooms = this._rooms.slice(0);
            let roomsNoHashIds = this._rooms.slice(0);

            for (let i=roomsNoHashIds.length; i--;) {
                roomsNoHashIds[i] = roomsNoHashIds[i] + '-noHashIds';
            }
            const flags = Object.assign({}, this.flags);

            // reset flags
            this._rooms = [];
            this.flags = {};

            if (rooms.length || flags.broadcast) {
                this.adapter.broadcast(packetDecoded, {
                    except: [this.id],
                    rooms: roomsNoHashIds,
                    flags: flags
                });
                this.adapter.broadcast(packet, {
                    except: [this.id],
                    rooms: rooms,
                    flags: flags
                });
            } else {
                // dispatch packet
                if (this.usingHashId !== undefined && this.usingHashId) {
                    this.packet(packet, flags);
                } else {
                    this.packet(packetDecoded, flags);
                }

            }
            return this;
        }
    }

    handleDataEmitAll () {
        let ioEmit = this.io.sockets.emit

        this.io.sockets.emit = function (ev) {
            if (events.DEFAULT_SOCKETIO_EVENTS.indexOf(ev) >= 0) {
                ioEmit.apply(this, arguments);
                return this;
            }

            const args = Array.prototype.slice.call(arguments);

            const packet = {
              type: (this.flags.binary !== undefined ? this.flags.binary : hasBin(args)) ? parser.BINARY_EVENT : parser.EVENT,
              data: args
            };

            // Decode Data by Hashids
            let argsDecoded = [].concat(args)

            if (argsDecoded[1] !== undefined && argsDecoded[1] !== null) {
                if (typeof(argsDecoded[1]) === 'string') {
                    argsDecoded[1] = ( typeof (hashidsHelper.decodeId(argsDecoded[1])) === 'number' ) ? hashidsHelper.decodeId(argsDecoded[1]) : argsDecoded[1]
                } else {
                    argsDecoded[1] = hashidsHelper.decode(argsDecoded[1])
                }
            }
            const packetDecoded = {
                type: (this.flags.binary !== undefined ? this.flags.binary : hasBin(argsDecoded)) ? parser.BINARY_EVENT : parser.EVENT,
                data: argsDecoded
            };

            if ('function' == typeof args[args.length - 1]) {
              throw new Error('Callbacks are not supported when broadcasting');
            }

            const rooms = this.rooms.slice(0);
            let roomsNoHashIds = this.rooms.slice(0);

            for (let i=roomsNoHashIds.length; i--;) {
                roomsNoHashIds[i] = roomsNoHashIds[i] + '-noHashIds';
            }

            const flags = Object.assign({}, this.flags);

            // reset flags
            this.rooms = [];
            this.flags = {};

            this.adapter.broadcast(packetDecoded, {
              rooms: roomsNoHashIds,
              flags: flags
            });

            this.adapter.broadcast(packet, {
                rooms: rooms,
                flags: flags
            });

            return this;
        }
    }
}
