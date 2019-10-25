// Just overriding this code directly for maximum performance.
const updateMatrixWorldOnlyIfVisible = function (force) {
    if (!this.visible) return;

    // Copied source follows here.
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.matrixWorldNeedsUpdate || force) {
        if (this.parent === null) {
            this.matrixWorld.copy(this.matrix);
        } else {
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }
        this.matrixWorldNeedsUpdate = false;
        force = true;
    }
    // update children
    var children = this.children;
    for (var i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(force);
    }
}

AFRAME.THREE.Object3D.prototype.updateMatrixWorld = updateMatrixWorldOnlyIfVisible

window.c8_getWorldPosition = (object) => {
    const position = new THREE.Vector3()
    position.setFromMatrixPosition(object.matrixWorld)
    return position
}

window.c8_getWorldQuaternion = (object) => {
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const target = new THREE.Quaternion();
    object.matrixWorld.decompose(position, target, scale);
    return target;
}

const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#4cd964', '#5ac8fa', '#007aff', '#5856d6', '#ff2d55']

AFRAME.registerComponent('note-creator', {
    schema: {
        type: 'array',
        default: []
    },
    init: function () {
        this.noteInput = document.getElementById('noteInput')
        const overlay = document.getElementById('overlay')
        const initialHeight = overlay.offsetHeight
        const initialWidth = overlay.offsetWidth

        const dropBtn = document.getElementById('dropButton')
        const newNote = document.getElementById('createNoteButton')

        let currentText = ''
        // this.noteInput.value = currentText

        const holdAnchor = document.getElementById('holdAnchor')

        let isEditing = false

        const scene = this.el.sceneEl

        let currentNote = null

        const startEditing = () => {
            if (isEditing) {
                return
            }
            isEditing = true

            this.noteInput.value = currentText

            this.noteInput.style.display = 'block'
            this.noteInput.focus()
            this.noteInput.style.opacity = '1'
            this.noteInput.style.pointerEvents = 'auto'

            console.log('started editing')
        }

        const stopEditing = () => {
            if (!isEditing) {
                return
            }
            isEditing = false
            this.noteInput.style.opacity = '0.01'
            this.noteInput.style.pointerEvents = 'none'
            this.noteInput.style.display = 'none'

            if (currentNote) {
                setNoteText(currentNote, currentText)
            } else {
                const color = colors[Math.floor(colors.length * Math.random())]
                createNote({
                    color,
                    text: currentText,
                    position: window.c8_getWorldPosition(holdAnchor.object3D),
                    rotation: window.c8_getWorldQuaternion(holdAnchor.object3D)
                })
            }
            currentNote = null
        }

        const createNote = ({text, color, position, rotation}) => {
            const note = document.createElement('a-entity')
            const noteText = document.createElement('a-entity')
            note.appendChild(noteText)
            scene.appendChild(note)

            note.classList.add('note')
            position && note.object3D.position.copy(position)
            rotation && note.object3D.quaternion.copy(rotation)
            color && note.setAttribute('material', `color:${color}`)
            note.setAttribute('geometry', 'primitive: box; width: 2; height: 2; depth: 0.1;')
            note.setAttribute('shadow', '')

            noteText.setAttribute('position', '0 0.5 0.065')
            noteText.setAttribute('geometry', 'primitive: plane; width: 1.75; height: 1.75;')
            noteText.setAttribute('material', 'transparent:true;opacity:0')
            noteText.setAttribute('text', 'value: placeholder;color:black;baseline:top;')
            setNoteText(note, text)

            note.addEventListener('click', function () {
                currentNote = note
                currentText = getNoteText(currentNote)
                startEditing()
                console.log(currentText)
            })

            return note
        }

        const setNoteText = (note, text) => {
            const noteText = note.children[0]
            noteText.setAttribute('text', `value:${text};wrapCount:${Math.min(15, text.length)}`)
        }

        const getNoteText = note => {
            return note.children[0].getAttribute('text').value
        }

        window.addEventListener('resize', e => {
            setTimeout(() => {
                if (overlay.offsetWidth == initialWidth && initialHeight > 1.5 * overlay.offsetHeight) {
                    // Keyboard is likely opened

                } else if (overlay.offsetHeight > 0.8 * initialHeight) {
                    // Keyboard is likely closed
                    stopEditing()
                }
            }, 500)
        })

        this.noteInput.addEventListener('blur', () => {
            stopEditing()
        })

        newNote.addEventListener('click', e => {

            newNote.classList.add('pulse-once')

            setTimeout(function () {
                newNote.classList.remove('pulse-once')
            }, 500)

            currentText = ''
            startEditing()
        })

        this.noteInput.addEventListener('keyup', e => {
            currentText = e.target.value
        })

        dropBtn.addEventListener('click', e => {
            //get all notes
            this.data = scene.querySelectorAll('.note')

            dropBtn.classList.add('pulse-once')

            setTimeout(function () {
                dropBtn.classList.remove('pulse-once')
            }, 500)

            //add gravity
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].getAttribute('dynamic-body') == null) {
                    this.data[i].setAttribute('body', {
                        type: 'dynamic',
                        mass: 5,
                        shape: 'none'
                    })
                    this.data[i].setAttribute('shape__main', {
                        shape: 'box',
                        halfExtents: '1 1 0.15',
                        offset: '0 0 0'
                    })
                    console.log('dropped: ' + this.data[i].text + ' out of total notes ' + this.data.length)
                }
            }

            // Make them disappear! (Pretty sure there's a better way to do this..)
            setTimeout(() => {
                for (var i = 0; i < this.data.length; i++) {
                    this.data[i].setAttribute('visible', 'false')
                }
            }, 1500)

        })

    }
})

AFRAME.registerComponent('shadow-material', {
    init: function () {
        this.material = new THREE.ShadowMaterial()
        this.el.getOrCreateObject3D('mesh').material = this.material
        this.material.opacity = 0.4
    }
})